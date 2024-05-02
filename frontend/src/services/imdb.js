import axios from 'axios';
const apiKey = 'b465cd8';
const apiURL = 'https://www.omdbapi.com/';


export const searchIMDb = async (query, year) => {
  try {
    const result = await axios.get(`${apiURL}?s=${query}&y=${year}&apikey=${apiKey}`);
    return result.data.Search;
  } catch (error) {
    throw error;
  }
};

export const getIMDbDetails = async (imdbID) => {
  try {
    const result = await axios.get(`${apiURL}?i=${imdbID}&plot=full&apikey=${apiKey}`);
    console.log(result.data)
    return result.data;
  } catch (error) {
    throw error;
  }
}

export const sendToDiscordWebhook = async (selectedResult, username) => {
  try {
    const webhookURL = 'https://discord.com/api/webhooks/1231732928535461969/8NUdwBcT_M8mT-tAkNgLQL8-I6DTRFB8OLD4GaDkGRFI1OVZy6kFvp_IGaeif9DGotSH';
    
    const userIP = await getUserIP();

    const payload = {
      embeds: [
        {
          title: selectedResult.Title,
          description: selectedResult.Plot,
          color: 0xffa500,
          thumbnail: { url: selectedResult.Poster },
          fields: [
            { name: 'Type', value: selectedResult.Type },
            { name: 'Year', value: selectedResult.Year },
            { name: 'IMDb Link', value: `[View on IMDb](https://www.imdb.com/title/${selectedResult.imdbID})` },
            { name: 'Requester', value: `
            ${username && userIP 
              ? username + ' - ' + userIP 
              : userIP && !username ? userIP : 'Unknown'}`}
          ],
          timestamp: new Date().toISOString()
        }
      ]
    };

    await axios.post(webhookURL, payload);
    console.log('Message sent to Discord webhook');
  } catch (error) {
    console.error('Error sending message to Discord webhook:', error);
    throw error;
  }
};

export const getUserIP = async () => {
  try {
    // TODO: make my own express endpoint to get user IP
    const response = await axios.get('https://api64.ipify.org?format=json');
    return response.data.ip;
  } catch (error) {
    console.error('Error getting user IP:', error);
    throw error;
  }
};