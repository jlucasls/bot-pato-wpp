const { google } = require("googleapis");
const axios = require("axios");
const logger = require("../utils/logger.utils");

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;
const ENDPOINT = process.env.ENDPOINT + "/messages/jobs/send-video-message";

const youtube = google.youtube({
    version: 'v3',
    auth: API_KEY
});

let videosConhecidos = new Set();

const LIMITE_MEMORIA = 10;

async function verifyNewVideos(){
    try {
        logger.info(`Verificando Youtube...`);

        const response = await youtube.search.list({
            channelId: CHANNEL_ID,
            part: ['id', 'snippet'],
            order: 'date',
            maxResults: 1,
            type: ['video']
        });

        const videos = response.data.items || [];
        const firstExecution = videosConhecidos.size === 0;
        let temVideo = false;

        for(const video of videos){
            const videoId = video.id?.videoId;
            if(!videoId) continue;

            if(!videosConhecidos.has(videoId)){
                temVideo = true;

                if(!firstExecution){
                    logger.info(`Novo vídeo detectado! Enviado para o grupo...`);

                    await axios.post(ENDPOINT, {
                        id: videoId,
                        title: video.snippet?.title,
                        url: `https://youtube.com/watch?v=${videoId}`,
                        publishedAt: video.snippet?.publishedAt
                    });
                }
                videosConhecidos.add(videoId);
            }
        }

        if(videosConhecidos.size >= LIMITE_MEMORIA){
            const arrayIds = Array.from(videosConhecidos);
            videosConhecidos = new Set(arrayIds.slice(-5));
        }

        if (!temVideo && !firstExecution) {
            logger.info(`Nenhum vídeo novo encontrado.`);
        }

    } catch (err) {
        logger.error("Erro ao processar checagem: ", err.message);
    }
}

module.exports = { verifyNewVideos };