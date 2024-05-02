import React, { forwardRef, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchIMDb, getIMDbDetails, sendToDiscordWebhook } from '../../services/imdb';
import { cap, replaceSpecialCharacters } from '../../services/helpers';
import { AuthContext } from '../../contexts/AuthContext';
import PlexRecentlyAdded from './PlexRecentlyAdded';
import { getPlexRequests, addPlexRequest } from '../../services/api';
import axios from 'axios';

const PlexRequests = forwardRef(({ onRequestSuccess }, ref) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchYear, setSearchYear] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [selectedResult, setSelectedResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const { username } = useContext(AuthContext);
    const navigate = useNavigate();
    const imdbID = window.location.pathname.split('/').pop();

    useEffect(() => {
        if (imdbID) {
            if (imdbID === 'plex') return;
            handleAutoSearch(imdbID);
        }
    }, [imdbID]);

    useEffect(() => {
    }, [username]);

    const handleAutoSearch = async (imdbID) => {
        try {
            setLoading(true);
            const details = await getIMDbDetails(imdbID);
            const inLibrary = await checkInLibrary(details.Title, details.Year);
            const inRequests = await checkInRequests(details.Title);
            setSelectedResult({ ...details, inLibrary, inRequests });
        } catch (error) {
            console.error('Error fetching IMDb details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setSearchResults(null);
        setSelectedResult(null);
        if (searchTerm === '') {
            setSearchTerm('');
            return;
        }
        try {
            setLoading(true);
            const results = await searchIMDb(searchTerm, searchYear);
            const resultsWithLibraryRequestsInfo = await Promise.all(results.map(async (result) => {
                const inLibrary = await checkInLibrary(result.Title, result.Year);
                const inRequests = await checkInRequests(result.Title);
                return { ...result, inLibrary, inRequests };
            }));
            console.log(resultsWithLibraryRequestsInfo);
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
            const inLibrary = await checkInLibrary(details.Title, details.Year);
            const inRequests = await checkInRequests(details.Title);
            setSelectedResult({ ...details, inLibrary, inRequests });
        }
        navigate(`/plex/${result}`);
    };

    const handleRequest = async (result) => {
        console.log(result);
        try {
            const response = await addPlexRequest(result.Type, result.Title);
            console.log(response);
            if (response.status === 200) {
                await sendToDiscordWebhook(selectedResult || result, username);
                setSearchResults(prevResults =>
                    prevResults.map(prevResult =>
                        prevResult.imdbID === result.imdbID
                            ? { ...prevResult, inRequests: true }
                            : prevResult
                    )
                );
                onRequestSuccess(result.Title);
            } else if (response.status === 201) {
                alert('Request already exists asshole');
            }
    
        } catch (error) {
            console.error('Error sending request to Discord:', error);
        }
    };
    

    const checkInRequests = async (title) => {
        try {
            const response = await getPlexRequests();
            const requests = response.data;
            const matchingRequest = requests.find(request => request.request.toLowerCase() === title.toLowerCase());
            return !!matchingRequest;
        } catch (error) {
            console.error('Error checking Plex requests:', error);
            return false;
        }
    };

    const checkInLibrary = async (title, year) => {
        try {
            const sectionIds = [5, 8];
            const imdbTitle = replaceSpecialCharacters(title).toLowerCase();
            for (const sectionId of sectionIds) {
                const response = await axios.get(`https://molex.cloud/api/plex/plex-library-search?sectionId=${sectionId}&title=${imdbTitle}`);
                const { tvShowLibrary, movieLibrary } = response.data.data;

                // Handling TV show data
                if (tvShowLibrary && tvShowLibrary.response && tvShowLibrary.response.data && Array.isArray(tvShowLibrary.response.data.data)) {
                    const matchingMedia = tvShowLibrary.response.data.data.filter(media => {
                        let plexTitle = replaceSpecialCharacters(media.title).toLowerCase();
                        if (plexTitle === 'the office (us)') {
                            plexTitle = 'the office';
                        }
                        const titleMatch = imdbTitle.includes(plexTitle);
                        const yearMatch = year.includes(media.year);
                        return titleMatch && yearMatch;
                    });
                    if (matchingMedia.length > 0) {
                        return true;
                    }
                }

                // Handling movie data
                if (movieLibrary && movieLibrary.response && movieLibrary.response.data && Array.isArray(movieLibrary.response.data.data)) {
                    const matchingMedia = movieLibrary.response.data.data.filter(media => {
                        const plexTitle = replaceSpecialCharacters(media.title).toLowerCase();
                        const titleMatch = imdbTitle.includes(plexTitle);
                        const yearMatch = year.includes(media.year);
                        return titleMatch && yearMatch;
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
            <form onSubmit={handleSearch}>
                <div className='imdbSearch'>
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder='Enter a movie or series title...' />
                    <input type="text" value={searchYear} onChange={(e) => setSearchYear(e.target.value)} placeholder="Optional: Release Year" className='searchYear' />
                    <button type="submit" className='button plexDetailsBtn searchBtn'><i className="fa-solid fa-magnifying-glass"></i>Search IMDB</button>
                </div>
            </form>

            {loading &&
                <div className="loadingContainer">
                    <div className='loadingText'>Fetching IMDB results and comparing to Plex Library... (doing shit)</div>
                    <div className="loading"></div>

                </div>
            } {/* Loading indicator */}

            <div className='resultsGrid'>
                {!selectedResult && searchResults && searchResults.map((result) => (
                    <div key={result.imdbID} className='plexResults searchPage'>
                        <div className='plexPosterDetails'>
                            <div className='searchFlex'>
                                <img className='plexPoster' src={result.Poster} alt={result.Title} />
                                {result.inLibrary && <div className='inLibrary'>In Library</div>}
                            </div>
                            <div className='resultsInfo'>
                                <div className='titleYear'>
                                    <div className='resultTitle'>{result.Title}</div>
                                    <div className='resultYear'>{result.Year}</div>
                                </div>
                                <div className='searchButtons'>
                                    {/* if is in library */}
                                    {<button className='button plexDetailsBtn' onClick={() => handleSelect(result.imdbID)}>{cap(result.Type)} Info</button>}
                                    {!result.inRequests && !result.inLibrary && (
                                        <button className='button plexSelect request' onClick={() => handleRequest(result)}>
                                            Request {cap(result.Type)}
                                        </button>
                                    )}
                                    {result.inRequests && !result.inLibrary && (
                                        <button className='button plexSelect request inRequestsBtn' disabled>
                                            Requested
                                        </button>
                                    )}

                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedResult &&
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
                                    {selectedResult.inRequests && (
                                        <button className='button plexSelect request inRequestsBtn' disabled>Request Exists</button>
                                    )}
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
            }

            {!selectedResult && <div className='plexHeader'>Recently Added in Media</div>}
            {!selectedResult && <PlexRecentlyAdded />}

        </div>
    );
});

export default PlexRequests;
