import React, { useState, useEffect } from 'react';
import { getPlexItems } from '../../services/api';

const PlexRecentlyAdded = () => {
    const [recentlyAdded, setRecentlyAdded] = useState([]);

    useEffect(() => {
        const fetchRecentlyAdded = async () => {
            try {
                const response = await getPlexItems();
                setRecentlyAdded(response.data);
            } catch (error) {
                console.error('Error fetching recently added Plex items:', error);
            }
        };

        fetchRecentlyAdded();
    }, []);

    return (

        <div className='resultsGrid'>
            {recentlyAdded.map(item => (
                <div className='plexResults recentPage' key={item.id}>
                    <div className='plexPosterDetailsRecent'>
                        <img className='plexPosterRecentAdded' src={item.poster_url} alt={item.title} />
                        <div className='resultsInfo'>
                            <div className='resultTitle'>{item.title}</div>
                            <div className='resultYear'>{item.release_year}</div>
                            <div className='rating'><i className="fa-brands fa-imdb"></i> {item.imdbRating} Rating</div>
                            <div className='resultGenres'>{item.genre}</div>
                        </div>
                        

                    </div>
                    <div className='resultPlot'>{item.plot}</div>
                    <div className='searchButtons'>
                            <button className='button plexDetailsBtn watchOnPlex' onClick={
                                () => {
                                    window.open(`${item.plexUrl}`, '_blank')
                                }
                            }><i class="fa-solid fa-play"></i> Watch on Plex</button>
                        </div>
                </div>
            ))}

        </div>
    );
};

export default PlexRecentlyAdded;
