import React, { forwardRef, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchIMDb, getIMDbDetails, sendToDiscordWebhook } from '../../services/imdb';
import { cap, replaceSpecialCharacters, formatDateTime } from '../../services/helpers';
import { AuthContext } from '../../contexts/AuthContext';
import PlexRecentlyAdded from './PlexRecentlyAdded';
import { getPlexRequestsByCount, getAllPlexRequests, addPlexRequest, updatePlexRequestStatus, deletePlexRequest, getPlexItemsByImdbID } from '../../services/api';
import axios from 'axios';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const PlexRequests = forwardRef(({ onRequestSuccess }, ref) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchYear, setSearchYear] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [recentPlexRequests, setRecentPlexRequests] = useState([]);
    const [allPlexRequests, setAllPlexRequests] = useState([]);
    const [selectedResult, setSelectedResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [requestCount, setRequestCount] = useState(5);
    const { username, isRole } = useContext(AuthContext);
    const navigate = useNavigate();
    const imdbID = window.location.pathname.split('/').pop();

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                let response;
                if (requestCount === 'all') {
                    response = await getAllPlexRequests();
                } else {
                    response = await getPlexRequestsByCount(requestCount);
                }
                console.log('Fetched requests:', response.data); 
                setRecentPlexRequests(response.data);
                setAllPlexRequests(response.data);
            } catch (error) {
                console.error('Error fetching Plex requests:', error);
                setRecentPlexRequests([]);
            }
        };

        fetchRequests();
    }, [requestCount]);
    

    useEffect(() => {
        if (imdbID && imdbID.includes('tt')) {
            handleAutoSearch(imdbID);
        }
    }, [imdbID]);
    

    const handleAutoSearch = async (imdbID) => {
        try {
            setLoading(true);
            const details = await getIMDbDetails(imdbID);
            const inLibrary = await checkInLibrary(details.Title, details.Year, details.imdbID, details.Type);
            const inRequests = await checkInRequests(details.imdbID);
            setSelectedResult({ ...details, inLibrary, inRequests });
        } catch (error) {
            console.error('Error fetching IMDb details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();

        if (searchTerm === '') {
            setSearchTerm('');
            setSearchResults(null);
            setSelectedResult(null);
            return;
        }
        try {
            setLoading(true);
            const results = await searchIMDb(searchTerm, searchYear);
            const resultsWithLibraryRequestsInfo = await Promise.all(results.map(async (result) => {
                const inLibrary = await checkInLibrary(result.Title, result.Year, result.imdbID, result.Type);
                const inRequests = await checkInRequests(result.imdbID);
                return { ...result, inLibrary, inRequests };
            }));
            setSearchResults(resultsWithLibraryRequestsInfo);
        } catch (error) {
            console.error('Error searching IMDb:', error);
        } finally {
            setLoading(false);
        }
    };

    const backToSearch = () => {
        setSelectedResult(null);
        navigate(`/plex`);
    };

    const handleSelect = async (result) => {
        const details = await getIMDbDetails(result);
        if (details) {
            const inLibrary = await checkInLibrary(details.Title, details.Year, details.imdbID, details.Type);
            const inRequests = await checkInRequests(details.imdbID);
            setSelectedResult({ ...details, inLibrary, inRequests });
        }
        navigate(`/plex/${result}`);
    };

    const handleRequest = async (result) => {
        try {
            const response = await addPlexRequest(result.Type, result.imdbID, result.Title);
            if (response.status === 200) {
                await sendToDiscordWebhook(selectedResult || result, username);
                setSearchResults(prevResults =>
                    prevResults.map(prevResult =>
                        prevResult.imdbID === result.imdbID
                            ? { ...prevResult, inRequests: true }
                            : prevResult
                    )
                );
                onRequestSuccess(result.Title).then(() => {
                    let time = new Date();
                    setRecentPlexRequests(prevRequests => [...prevRequests, { request: result.Title, imdbID: result.imdbID, status: 'pending', updatedAt: time }]);
                });
            } else if (response.status === 201) {
                alert('Request already exists');
            }
        } catch (error) {
            console.error('Error sending request to Discord:', error);
        }
    };

    const checkInRequests = (imdbID) => {
        console.log('Checking requests for:', imdbID);
        const matchingRequest = allPlexRequests.find(request => request.imdbID === imdbID);
    
        if (matchingRequest) {
            return true;
        } else {
            // Fetch requests and check again if not found
            console.log('Fetching all requests...');
            getAllPlexRequests()
                .then(response => {
                    const updatedRequests = response.data;
                    setAllPlexRequests(updatedRequests);
                    
                    const updatedMatchingRequest = updatedRequests.find(request => request.imdbID === imdbID);
                    return !!updatedMatchingRequest;
                })
                .catch(error => {
                    console.error('Error checking Plex requests:', error);
                    return false;
                });
        }
    };
    

    const checkInLibrary = async (title, year, imdbID, type) => {
        try {
            const sectionIds = [5, 8];
            const imdbTitle = replaceSpecialCharacters(title).toLowerCase();
            for (const sectionId of sectionIds) {
                const response = await axios.get(`https://molex.cloud/api/plex/plex-library-search?sectionId=${sectionId}&title=${imdbTitle}`);
                const { tvShowLibrary, movieLibrary } = response.data.data;

                // Handling TV show data
                if (tvShowLibrary && tvShowLibrary.response && tvShowLibrary.response.data && Array.isArray(tvShowLibrary.response.data.data) && type === 'series') {
                    const recentById = await getPlexItemsByImdbID(imdbID);
                    const matchingMedia = tvShowLibrary.response.data.data.filter(media => {
                        let plexTitle = replaceSpecialCharacters(media.title).toLowerCase();
                        if (plexTitle === 'the office (us)') {
                            plexTitle = 'the office';
                        }
                        const titleMatch = imdbTitle.includes(plexTitle);
                        const yearMatch = year.includes(media.year);
                        const recentMatch = recentById.data;
                        return recentMatch || (titleMatch && yearMatch);
                    });
                    if (matchingMedia.length > 0) {
                        return true;
                    }
                }

                // Handling movie data
                if (movieLibrary && movieLibrary.response && movieLibrary.response.data && Array.isArray(movieLibrary.response.data.data) && type === 'movie') {
                    const recentById = await getPlexItemsByImdbID(imdbID);
                    const matchingMedia = movieLibrary.response.data.data.filter(media => {
                        const plexTitle = replaceSpecialCharacters(media.title).toLowerCase();
                        const titleMatch = imdbTitle.includes(plexTitle);
                        const yearMatch = year.includes(media.year);
                        return recentById.data || (titleMatch && yearMatch);
                    });
                    if (matchingMedia.length > 0) {
                        return true;
                    }
                }
            }
            return false;
        } catch (error) {
            console.error('Error checking Plex library:', error);
            return false;
        }
    };

    return (
        <div ref={ref}>
            {/* list recent plex requests */}
            {Array.isArray(recentPlexRequests) && (
                <>
                    <div className='plexRequestHeader'>
                        Recently Requested
                        <div className='requestCountDropdown'>
                            Recent Count
                            <select
                                value={requestCount}
                                onChange={(e) => setRequestCount(e.target.value)}
                                style={{ float: 'right', margin: '0 1rem' }}
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={'all'}>All</option>
                            </select>  
                        </div>
                        
                    </div>
                    <div className='requestsGrid'>
                        {recentPlexRequests.map((request) => (
                            <div key={request.id} className='plexRequests searchPage'>
                                <div className='plexRequestDetails'>
                                    <div className='requestInfo'>
                                        <div className='titleYear'>
                                            <div className='requestTitle'>{request.request}</div>
                                        </div>
                                        <div className='requestBottom'>
                                            <div className='requestStatus'>Status <span className={`status ${request.status}`}>{cap(request.status)}</span></div>
                                            <div className='requestYear'>{formatDateTime(request.updatedAt) || formatDateTime(request.createdAt)}</div>
                                        </div>
                                    </div>
                                    {isRole('admin') && (
                                        <div className='adminButtons'>
                                            <div className='adminActions'>
                                                {request.status === 'pending' && (
                                                    <button className='button requestFulfill' onClick={() => {
                                                        updatePlexRequestStatus(request.request, 'fulfilled')
                                                        setRecentPlexRequests(recentPlexRequests.map(req => req.id === request.id ? { ...req, status: 'fulfilled' } : req));
                                                    }}>Fulfill</button>
                                                )}
                                                {request.status === 'pending' && (
                                                    <button className='button requestReject' onClick={() => {
                                                        updatePlexRequestStatus(request.request, 'rejected')
                                                        setRecentPlexRequests(recentPlexRequests.map(req => req.id === request.id ? { ...req, status: 'rejected' } : req));
                                                    }}>Reject</button>
                                                )}
                                                {(request.status === 'fulfilled' || request.status === 'rejected') && (
                                                    <button className='button requestUnfulfill' onClick={() => {
                                                        updatePlexRequestStatus(request.request, 'pending');
                                                        setRecentPlexRequests(recentPlexRequests.map(req => req.id === request.id ? { ...req, status: 'pending' } : req));
                                                    }}>Unfulfill</button>
                                                )}
                                            </div>
                                            {/* delete request */}
                                            <button className='button requestDelete' onClick={() => {
                                                if (window.confirm('Are you sure you want to delete this request?')) {
                                                    deletePlexRequest(request.id);
                                                    setRecentPlexRequests(recentPlexRequests.filter(req => req.id !== request.id));
                                                }
                                            }}><RemoveCircleOutlineIcon style={{ height: '1rem', width: 'fit-content' }} /> </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <div className='plexHeader'><SearchIcon />Search IMDB</div>

            <form onSubmit={handleSearch}>
                <div className='imdbSearch'>
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder='Enter a movie or series title...' />
                    <input type="text" value={searchYear} onChange={(e) => setSearchYear(e.target.value)} placeholder="Optional: Release Year" className='searchYear' />
                    <button type="submit" className='button plexSelect searchBtn'><i className="fa-solid fa-magnifying-glass"></i>Search IMDB</button>
                </div>
            </form>

            {loading && (
                <div className="loadingContainer">
                    <div className='loadingText'>Fetching IMDB results and comparing to Plex Library... (doing shit)</div>
                    <div className="loading"></div>
                </div>
            )}

            {/* Loading indicator */}

            {!selectedResult && searchResults && (
                <div className='resultsGrid'>
                    {searchResults.map((result) => (
                        <div key={result.imdbID} className='plexResults searchPage'>
                            <div className='plexPosterDetails'>
                                <div className='searchFlex'>
                                    <img className='plexPoster' src={result.Poster} alt={result.Title} />
                                    {result.inLibrary && <div className='inLibrary'>In Library</div>}
                                    {result.inRequests && <div className='inRequests'>Requested</div>}
                                </div>
                                <div className='resultsInfo'>
                                    <div className='titleYear'>
                                        <div className='resultTitle'>{result.Title}</div>
                                        <div className='resultYear'>{result.Year}</div>
                                    </div>
                                    <div className='searchButtons'>
                                        <button className='button plexDetailsBtn' onClick={() => handleSelect(result.imdbID)}><InfoOutlinedIcon /> Details</button>
                                        {!result.inRequests && !result.inLibrary && (
                                            <button className='button plexSelect request' onClick={() => handleRequest(result)}>
                                                <AddIcon /> Request {cap(result.Type)}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedResult && (
                <div className='plexResults'>
                    <div className='plexPosterDetails'>
                        <div className='plexSelector'>
                            <img className='plexPoster more' src={selectedResult.Poster} alt={selectedResult.Title} />
                            <div className='plexMoreDetails'>
                                <div className='rating'><i className="fa-brands fa-imdb"></i> {selectedResult.imdbRating} Rating</div>
                                <div className='boxOffice'> {selectedResult.BoxOffice && <div>Box Office</div>} {selectedResult.BoxOffice}</div>
                                <div className='plexButtons'>
                                    {/* if is in library */}
                                    {selectedResult.inLibrary && <button className='button plexSelect request inLibraryBtn' disabled>In Library</button>}
                                    {!selectedResult.inLibrary && !selectedResult.inRequests && (
                                        <button className='button plexSelect request' onClick={() => handleRequest(selectedResult)}>Request {cap(selectedResult.Type)}</button>
                                    )}
                                    {selectedResult.inRequests && <button className='button plexSelect request inRequestsBtn' disabled>Request Exists</button>}
                                    <button className='button plexDetailsBtn' onClick={
                                        () => window.open(`https://www.imdb.com/title/${selectedResult.imdbID}`, '_blank')
                                    }>View IMDB</button>
                                    <button className='button plexDetailsBtn' onClick={backToSearch}>Back to Search</button>
                                </div>
                            </div>
                        </div>

                        <div className='plexDetails'>
                            <div className='title'>{selectedResult.Title}</div>
                            <div className='year'>{selectedResult.Year}</div>
                            <div className='ratingRuntime'>
                                <div className='rated'>{selectedResult.Rated}</div>
                                <div className='runtime'><i className="fa-solid fa-stopwatch"></i> {selectedResult.Runtime}</div>
                            </div>
                            <div className='genres'>{selectedResult.Genre}</div>
                            <div className='plot'>
                                <div>{selectedResult.Plot}</div>
                            </div>
                            <div className='detailsHeader'>Cast & Crew</div>
                            <div className='director'><i className="fa-solid fa-user"></i> Directed by <span>{selectedResult.Director}</span></div>
                            <div className='writer'><i className="fa-solid fa-user"></i> Written by <span>{selectedResult.Writer}</span></div>
                            <div className='actors'><i className="fa-solid fa-users"></i> <span>{selectedResult.Actors}</span></div>
                            <div className='awards'>{selectedResult.Awards}</div>
                        </div>
                    </div>
                </div>
            )}

            {!selectedResult && <div className='plexRecentHeader'>Recently Added</div>}
            {!selectedResult && <PlexRecentlyAdded />}

        </div>
    );
});

export default PlexRequests;