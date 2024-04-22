import React, { forwardRef, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchIMDb, getIMDbDetails, sendToDiscordWebhook } from '../../services/imdb';
import { cap } from '../../services/helpers';
import { AuthContext } from '../../contexts/AuthContext';
import PlexRecentlyAdded from './PlexRecentlyAdded';
import axios from 'axios';

const PlexRequests = forwardRef(({ onRequestSuccess }, ref) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchYear, setSearchYear] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [selectedResult, setSelectedResult] = useState(null);
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
            const details = await getIMDbDetails(imdbID);
            const inLibrary = await checkInLibrary(details.Title);
            setSelectedResult({ ...details, inLibrary }); 
        } catch (error) {
            console.error('Error fetching IMDb details:', error);
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
            const results = await searchIMDb(searchTerm, searchYear);
            const resultsWithLibraryInfo = await Promise.all(results.map(async (result) => {
                const inLibrary = await checkInLibrary(result.Title);
                return { ...result, inLibrary };
            }));
            setSearchResults(resultsWithLibraryInfo);
        } catch (error) {
            console.error('Error searching IMDb:', error);
        }
    };

    const backToSearch = () => {
        setSelectedResult(null);
        navigate(`/plex`);
    };

    const handleSelect = async (result) => {
        console.log("Selected IMDb ID:", result);
        const details = await getIMDbDetails(result);
        setSelectedResult(details);
        onRequestSuccess(result);
        navigate(`/plex/${result}`);
    };

    const handleRequest = async (result) => {
        try {
            await sendToDiscordWebhook(selectedResult || result, username);
        } catch (error) {
            console.error('Error sending request to Discord:', error);
        }
    };

    const checkInLibrary = async (title, year) => {
        try {
            const sectionIds = [5, 8];
            for (const sectionId of sectionIds) {
                const response = await axios.get(`https://molex.cloud/api/plex/proxy?sectionId=${sectionId}&title=${title}`);
                let data = response.data.response.data.data;
                console.log(data);
                if (Array.isArray(data)) {
                    const matchingMedia = data.filter(media => {
                        const titleMatch = media.title.trim().toLowerCase() === title.trim().toLowerCase();
                        const yearMatch = year ? media.year === year : true;
                        return titleMatch && yearMatch;
                    });
                    
                    if (matchingMedia.length > 0) {
                        return true;
                    }
                } else {
                    console.log(data + ' was not an array')
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
                                    {!result.inLibrary && <button className='button plexSelect request' onClick={() => handleRequest(result)}>Request {cap(result.Type)}</button>}
                                    <button className='button plexDetailsBtn' onClick={() => handleSelect(result.imdbID)}>{cap(result.Type)} Info</button>
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
                                    {!selectedResult.inLibrary && <button className='button plexSelect request' onClick={handleRequest}>Request {cap(selectedResult.Type)}</button>}
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
