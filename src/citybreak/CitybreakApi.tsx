import axios from 'axios';
import { authConfig, baseUrl, getLogger, withLogs } from '../core';
import { CitybreakProps } from './CitybreakProps';

const itemUrl = `http://${baseUrl}/api/citybreak`;

export const getCitybreaks: (token: string) => Promise<CitybreakProps[]> = token => {
    return withLogs(axios.get(itemUrl, authConfig(token)), 'getItems');
}

export const createCitybreak: (token: string, item: CitybreakProps) => Promise<CitybreakProps[]> = (token, item) => {
    return withLogs(axios.post(itemUrl, item, authConfig(token)), 'createItem');
}

export const updateCitybreak: (token: string, item: CitybreakProps) => Promise<CitybreakProps[]> = (token, item) => {
    return withLogs(axios.put(`${itemUrl}/${item._id}`, item, authConfig(token)), 'updateItem');
}
export const eraseCitybreak: (token: string, item: CitybreakProps) => Promise<CitybreakProps[]> = (token, item) => {
    return withLogs(axios.delete(`${itemUrl}/${item._id}`,authConfig(token)), 'deleteItem');
}

interface MessageData {
    type: string;
    payload: CitybreakProps;
}

const log = getLogger('ws');

export const newWebSocket = (token: string, onMessage: (data: MessageData) => void) => {
    const ws = new WebSocket(`ws://${baseUrl}`);
    ws.onopen = () => {
        log('web socket onopen');
        ws.send(JSON.stringify({ type: 'authorization', payload: { token } }));
    };
    ws.onclose = () => {
        log('web socket onclose');
    };
    ws.onerror = error => {
        log('web socket onerror', error);
    };
    ws.onmessage = messageEvent => {
        log('web socket onmessage');
        onMessage(JSON.parse(messageEvent.data));
    };
    return () => {
        ws.close();
    }
}