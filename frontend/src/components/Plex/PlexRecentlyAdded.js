import React, { useState, useEffect } from 'react';
import { getPlexItems } from '../../services/api';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import StarBorderPurple500Icon from '@mui/icons-material/StarBorderPurple500';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

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
                        <div className='recentInfo'>
                            <div className='resultTitle'>{item.title}</div>
                            {item.release_year && <div className='resultYear'><CalendarTodayIcon/> {item.release_year}</div> }
                            {item.imdbRating && <div className='rating'><StarBorderPurple500Icon/> {item.imdbRating} Rating</div>}
                            <div className='resultGenres'>{item.genre}</div>
                        </div>
                        

                    </div>
                    <div className='resultPlot'>{item.plot}</div>
                    <div className='searchButtons'>
                            <button className='button plexDetailsBtn watchOnPlex' onClick={
                                () => {
                                    window.open(`${item.plexUrl}`, '_blank')
                                }
                            }><i className="fa-solid fa-play"></i> Watch on Plex</button>
                        </div>
                </div>
            ))}

        </div>
    );
};

export default PlexRecentlyAdded;
