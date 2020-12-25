import axios from 'axios';
import {authConfig, baseUrl, getLogger, withLogs} from '../core';
import {CityBreakProps} from './CityBreakProps';
import {Plugins} from "@capacitor/core";

const {Storage} = Plugins;
const itemUrl = `http://${baseUrl}/api/cityBreak`;


export const getCityBreaks: (token: string) => Promise<CityBreakProps[]> = (token) => {
    var result = axios.get(itemUrl, authConfig(token));
    result.then(function (result) {
        result.data.forEach(async (item: CityBreakProps) => {
            await Storage.set({
                key: item._id!,
                value: JSON.stringify({
                    id: item._id,
                    name: item.name,
                    startDate: item.startDate,
                    endDate: item.endDate,
                    price: item.price,
                    transportIncluded: item.transportIncluded,
                    userId: item.userId
                }),
            });
        });
    });


    return withLogs(result, 'getCityBreaks');

}

export const createCityBreak: (
    token: string,
    item: CityBreakProps
) => Promise<CityBreakProps> = (token, item) => {
    var result = axios.post(itemUrl, item, authConfig(token));
    result.then(async function (r) {
        var item = r.data;
        await Storage.set({
            key: item._id!,
            value: JSON.stringify({
                id: item._id,
                name: item.name,
                startDate: item.startDate,
                endDate: item.endDate,
                price: item.price,
                transportIncluded: item.transportIncluded,
                userId: item.userId
            }),

        });
    });
    return withLogs(result, 'createCityBreak');
}

export const updateCityBreak: (
    token: string,
    item: CityBreakProps
) => Promise<CityBreakProps> = (token, item) => {
    var result = axios.put(`${itemUrl}/${item._id}`, item, authConfig(token));
    result.then(async function (r) {
        var item = r.data;
        await Storage.set({
            key: item._id!,
            value: JSON.stringify({
                id: item._id,
                name: item.name,
                startDate: item.startDate,
                endDate: item.endDate,
                price: item.price,
                transportIncluded: item.transportIncluded,
                userId: item.userId
            }),
        });
    });
    return withLogs(result, "updateCityBreak");
};


export const eraseCityBreak: (
    token: string,
    item: CityBreakProps
) => Promise<CityBreakProps[]> = (token, item) => {
    var result = axios.delete(`${itemUrl}/${item._id}`, authConfig(token));
    result.then(async function (r) {
        var item = r.data;
        await Storage.remove({
            key: item._id!
        });
    });
    return withLogs(result, "deleteItem");
};


export const getCityBreak: (token: string, id: string) => Promise<CityBreakProps> = (token, id) => {
    var result = axios.get(`${itemUrl}/${id}`, authConfig(token))
    return withLogs(result, "getCityBreak");
}


interface MessageData {
    type: string;
    payload: CityBreakProps;
}

const log = getLogger('ws');

export const newWebSocket = (token: string, onMessage: (data: MessageData) => void) => {
    const ws = new WebSocket(`ws://${baseUrl}`);
    ws.onopen = () => {
        log('web socket onopen');
        ws.send(JSON.stringify({type: 'authorization', payload: {token}}));
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
//
// export const getCitybreaks: (token: string) => Promise<CitybreakProps[]> = token => {
//     return withLogs(axios.get(itemUrl, authConfig(token)), 'getItems');
// }
//
// export const createCitybreak: (token: string, item: CitybreakProps) => Promise<CitybreakProps[]> = (token, item) => {
//     return withLogs(axios.post(itemUrl, item, authConfig(token)), 'createItem');
// }
//
// export const updateCitybreak: (token: string, item: CitybreakProps) => Promise<CitybreakProps[]> = (token, item) => {
//     return withLogs(axios.put(`${itemUrl}/${item._id}`, item, authConfig(token)), 'updateItem');
// }
// export const eraseCitybreak: (token: string, item: CitybreakProps) => Promise<CitybreakProps[]> = (token, item) => {
//     return withLogs(axios.delete(`${itemUrl}/${item._id}`,authConfig(token)), 'deleteItem');
// }
//
// interface MessageData {
//     type: string;
//     payload: CitybreakProps;
// }
//
// const log = getLogger('ws');
//
// export const newWebSocket = (token: string, onMessage: (data: MessageData) => void) => {
//     const ws = new WebSocket(`ws://${baseUrl}`);
//     ws.onopen = () => {
//         log('web socket onopen');
//         ws.send(JSON.stringify({ type: 'authorization', payload: { token } }));
//     };
//     ws.onclose = () => {
//         log('web socket onclose');
//     };
//     ws.onerror = error => {
//         log('web socket onerror', error);
//     };
//     ws.onmessage = messageEvent => {
//         log('web socket onmessage');
//         onMessage(JSON.parse(messageEvent.data));
//     };
//     return () => {
//         ws.close();
//     }
// }