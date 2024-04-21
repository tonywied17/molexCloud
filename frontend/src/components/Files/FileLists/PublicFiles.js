import React, { useState, useEffect, useContext } from 'react';
import { downloadFile, deleteFile } from '../../../services/api';
import { getMimeIcon } from '../../../services/helpers';
import { formatFileSize } from '../../../services/helpers';
import { AuthContext } from '../../../contexts/AuthContext';

const PublicFiles = ({ files, onDeleteSuccess, onDownloadSuccess }) => {
  const [searchText, setSearchText] = useState('');
  const [expandedYears, setExpandedYears] = useState({});
  const { isLoggedIn, userId } = useContext(AuthContext);

  useEffect(() => {
    if (files && files.files) {
      const mostRecentDate = findMostRecentDate(files.files);
      if (mostRecentDate) {
        const { year, month, day } = mostRecentDate;
        setExpandedYears((prevExpandedYears) => ({
          ...prevExpandedYears[year],
          [year]: {
            ...prevExpandedYears[year],
            [month]: {
              ...prevExpandedYears[year]?.[month],
              [day]: true,
            },

          },
        }));
      }
    }
  }, [files]);

  const findMostRecentDate = (fileList) => {
    let mostRecentDate;
    fileList.forEach((file) => {
      const date = new Date(file.createdAt);
      const year = date.getFullYear();
      const month = date.toLocaleString('default', { month: 'long' });
      const day = date.getDate();
      if (!mostRecentDate || date > mostRecentDate.date) {
        mostRecentDate = { year, month, day, date };
      }
    });
    return mostRecentDate;
  };


  if (!files) {
    return <p>Loading...</p>;
  }

  const fileList = files.files || [];
  const filteredFiles = fileList.filter((file) =>
    file.filename.toLowerCase().includes(searchText.toLowerCase())
  );

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  };

  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
  };

  const toggleYear = (year) => {
    setExpandedYears((prevExpandedYears) => ({
      ...prevExpandedYears,
      [year]: !prevExpandedYears[year],
    }));
  };

  const toggleMonth = (year, month) => {
    setExpandedYears((prevExpandedYears) => ({
      ...prevExpandedYears,
      [year]: {
        ...prevExpandedYears[year],
        [month]: !prevExpandedYears[year]?.[month],
      },
    }));
  };

  const toggleDay = (year, month, day) => {
    setExpandedYears((prevExpandedYears) => ({
      ...prevExpandedYears,
      [year]: {
        ...prevExpandedYears[year],
        [month]: {
          ...prevExpandedYears[year]?.[month],
          [day]: !prevExpandedYears[year]?.[month]?.[day],
        },
      },
    }));
  };
  
  const handleDeleteFile = (fileId) => async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete this file?');
    if (!confirmDelete) {
      return;
    }
    
    try {
      const response = await deleteFile(fileId);
      
      if(response.status === 400) {
        alert(response.data.error)
      } 

      onDeleteSuccess();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };
  const handleFileDownload = async (fileId, filename) => {
    try {
      const response = await downloadFile(fileId, filename);
    
      onDownloadSuccess();

      return response;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  };

  const countItems = (year, month, day) => {
    if (!year) return Object.keys(groupFilesByDate(fileList)).length;
    if (!month) return Object.keys(groupFilesByDate(fileList)[year]).length;
    if (!day) return Object.keys(groupFilesByDate(fileList)[year][month]).length;
    return groupFilesByDate(fileList)[year][month][day].length;
  };

  return (
    <div className='filesContainer'>
      <div className='filesHeader'>
        <div>
          <input
            type='text'
            value={searchText}
            placeholder='Search...'
            onChange={handleSearchChange}
          />
        </div>
        <div className='fileTypesContainer'>
          {files && files.fileTypeCounts && Object.entries(files.fileTypeCounts).map(([fileType, count], index, array) => (
            <div className='fileTypesText' key={fileType}>
              <span>{fileType}</span> <span>{count}</span>
            </div>
          ))}
        </div>
      </div>
      {!searchText && (
        <div className='fileTree'>
          {Object.entries(groupFilesByDate(fileList)).map(([year, months]) => (
            <div key={year} className='yearNode'>
              {/* Toggle Year Tree */}
              <h3 onClick={() => toggleYear(year)}>
                {year} <span className='countItemsText'>{countItems(year)} items {expandedYears[year] ? '▲' : '▼'}</span>
              </h3>
              {expandedYears[year] && (
                <div className='monthNodes'>
                  {Object.entries(months).map(([month, days]) => (
                    <div key={month} className='monthNode'>
                      {/* Toggle Month Tree */}
                      <h4 onClick={() => toggleMonth(year, month)}>
                        {month} <span className='countItemsText'>{countItems(year, month)} items {expandedYears[year]?.[month] ? '▲' : '▼'}</span>
                      </h4>
                      {expandedYears[year]?.[month] && (
                        <div className='dayNodes'>
                          {Object.entries(days).map(([day, dayFiles]) => (
                            <div key={day} className='dayNode'>
                              {/* Toggle Day Files */}
                              <h5 onClick={() => toggleDay(year, month, day)}>
                                {day} <span className='countItemsText'>{countItems(year, month, day)} files {expandedYears[year]?.[month]?.[day] ? '▲' : '▼'}</span>
                              </h5>
                              {expandedYears[year]?.[month]?.[day] && (
                                <div className='fileGrids'>
                                  {dayFiles.map((file, index) => (
                                    <div className='fileDetailsBox' key={index}>
                                      <div className='fileDetailsContainer'>
                                        <div className='fileTopContainer'>
                                          <div>{file.filename}</div>
                                          <button
                                            className='button copyLink'
                                            onClick={() =>
                                              copyToClipboard(
                                                'https://molex.cloud/api/files/' + file.id
                                              )
                                            }
                                          >
                                            <i className="fa-solid fa-link"></i>
                                          </button>
                                        </div>
                                        <div className='fileDeets'>
                                          <div className='fileTypeIconContainer'>
                                            <i className={`fileDetailsMimeType fa-regular ${getMimeIcon(file.fileType)}`}></i>
                                            <span>{file.fileType}</span>
                                            <div>{formatFileSize(file.fileSize)}</div>
                                          </div>
                                          <div className='fileAttribs'>
                                            
                                            <div>{file.downloads} downloads</div>
                                            {isLoggedIn && file.UserId === userId ? <div>added by you</div> : <div>added by {file.author}</div>}

                                          </div>
                                        </div>

                                      </div>
                                      <div className='fileButtonsContainer'>
                                        <button
                                          className='button downloadFile'
                                          onClick={() => handleFileDownload(file.id, file.filename)}
                                          >
                                          Download
                                        </button>
                                        {isLoggedIn && file.UserId === userId && <button className='button deleteFile' onClick={handleDeleteFile(file.id)}>Delete</button>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {searchText && (
        <div className='fileGrids'>
          {filteredFiles.map((file, index) => (
            <div className='fileDetailsBox' key={index}>
              <div className='fileDetailsContainer'>
                <div>{file.filename}</div>
                <div>{file.fileType}</div>
              </div>
              <div className='fileButtonsContainer'>
                <button
                  className='button'
                  onClick={() =>
                    copyToClipboard(
                      'https://molex.cloud/api/files/download/' + file.id
                    )
                  }
                >
                  Copy Share Link
                </button>
                <button
                  className='button'
                  onClick={() => downloadFile(file.id, file.filename)}
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicFiles;

// Function to group files by date
const groupFilesByDate = (files) => {
  return files.reduce((acc, file) => {
    const date = new Date(file.createdAt);
    const year = date.getFullYear();
    const month = date.toLocaleString('default', { month: 'long' });
    const day = date.getDate();

    if (!acc[year]) {
      acc[year] = {};
    }
    if (!acc[year][month]) {
      acc[year][month] = {};
    }
    if (!acc[year][month][day]) {
      acc[year][month][day] = [];
    }
    acc[year][month][day].push(file);

    return acc;
  }, {});
};
