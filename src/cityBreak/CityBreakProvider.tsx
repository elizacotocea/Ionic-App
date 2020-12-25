import React, {useCallback, useContext, useEffect, useReducer} from "react";
import PropTypes from "prop-types";
import {getLogger} from "../core";
import {CityBreakProps} from "./CityBreakProps";
import {Plugins} from "@capacitor/core";

import {
    createCityBreak,
    getCityBreaks,
    newWebSocket,
    updateCityBreak,
    eraseCityBreak, getCityBreak
} from "./CityBreakApi";
import {AuthContext} from "../auth";

const log = getLogger("CityBreakProvider");
const {Storage} = Plugins;

type SaveCityBreakFn = (cityBreak: CityBreakProps, connected: boolean) => Promise<any>;
type DeleteCityBreakFn = (cityBreak: CityBreakProps, connected: boolean) => Promise<any>;
type UpdateServerFn = () => Promise<any>;
type ServerCityBreak = (id: string, version: number) => Promise<any>;

export interface CityBreaksState {
    cityBreaks?: CityBreakProps[];
    oldCityBreak?: CityBreakProps,
    fetching: boolean;
    fetchingError?: Error | null;
    saving: boolean;
    deleting: boolean;
    savingError?: Error | null;
    deletingError?: Error | null;
    saveCityBreak?: SaveCityBreakFn;
    deleteCityBreak?: DeleteCityBreakFn;
    updateServer?: UpdateServerFn;
    getServerCityBreak?: ServerCityBreak;
}

interface ActionProps {
    type: string;
    payload?: any;
}

const initialState: CityBreaksState = {
    fetching: false,
    saving: false,
    deleting: false,
};

const FETCH_ITEMS_STARTED = "FETCH_ITEMS_STARTED";
const FETCH_ITEMS_SUCCEEDED = "FETCH_ITEMS_SUCCEEDED";
const FETCH_ITEMS_FAILED = "FETCH_ITEMS_FAILED";
const SAVE_ITEM_STARTED = "SAVE_ITEM_STARTED";
const SAVE_ITEM_SUCCEEDED = "SAVE_ITEM_SUCCEEDED";
const SAVE_ITEM_FAILED = "SAVE_ITEM_FAILED";
const DELETE_ITEM_STARTED = "DELETE_ITEM_STARTED";
const DELETE_ITEM_SUCCEEDED = "DELETE_ITEM_SUCCEEDED";
const DELETE_ITEM_FAILED = "DELETE_ITEM_FAILED";

const SAVE_ITEM_SUCCEEDED_OFFLINE = "SAVE_ITEM_SUCCEEDED_OFFLINE";
const CONFLICT = "CONFLICT";
const CONFLICT_SOLVED = "CONFLICT_SOLVED";

const reducer: (state: CityBreaksState, action: ActionProps) => CityBreaksState = (
    state,
    {type, payload}
) => {
    switch (type) {
        case FETCH_ITEMS_STARTED:
            return {...state, fetching: true, fetchingError: null};
        case FETCH_ITEMS_SUCCEEDED:
            return {...state, cityBreaks: payload.cityBreaks, fetching: false};
        case FETCH_ITEMS_FAILED:
            //return { ...state, fetchingError: payload.error, fetching: false };
            return {...state, cityBreaks: payload.cityBreaks, fetching: false};
        case SAVE_ITEM_STARTED:
            return {...state, savingError: null, saving: true};
        case SAVE_ITEM_SUCCEEDED:
            const cityBreaks = [...(state.cityBreaks || [])];
            const cityBreak = payload.cityBreak;
            if (cityBreak._id !== undefined) {
                const index = cityBreaks.findIndex((it) => it._id === cityBreak._id);
                if (index === -1) {
                    cityBreaks.splice(0, 0, cityBreak);
                } else {
                    cityBreaks[index] = cityBreak;
                }
                return {...state, cityBreaks, saving: false};
            }
            return {...state, cityBreaks};

        case SAVE_ITEM_SUCCEEDED_OFFLINE: {
            const cityBreaks = [...(state.cityBreaks || [])];
            const cityBreak = payload.cityBreak;
            const index = cityBreaks.findIndex((it) => it._id === cityBreak._id);
            if (index === -1) {
                cityBreaks.splice(0, 0, cityBreak);
            } else {
                cityBreaks[index] = cityBreak;
            }
            return {...state, cityBreaks, saving: false};
        }

        case CONFLICT: {
            log("CONFLICT: " + JSON.stringify(payload.cityBreak));
            return {...state, oldCityBreak: payload.cityBreak};
        }

        case CONFLICT_SOLVED: {
            log("CONFLICT_SOLVED");
            return {...state, oldCityBreak: undefined};
        }

        case SAVE_ITEM_FAILED:
            return {...state, savingError: payload.error, saving: false};

        case DELETE_ITEM_STARTED:

            return {...state, deletingError: null, deleting: true};
        case DELETE_ITEM_SUCCEEDED: {
            const cityBreaks = [...(state.cityBreaks || [])];
            const cityBreak = payload.cityBreak;
            const index = cityBreaks.findIndex((it) => it._id === cityBreak._id);
            cityBreaks.splice(index, 1);
            return {...state, cityBreaks, deleting: false};
        }

        case DELETE_ITEM_FAILED:
            return {...state, deletingError: payload.error, deleting: false};

        default:
            return state;
    }
};

export const CityBreakContext = React.createContext<CityBreaksState>(initialState);

interface CityBreakProviderProps {
    children: PropTypes.ReactNodeLike;
}

export const CityBreakProvider: React.FC<CityBreakProviderProps> = ({children}) => {
    const {token, _id} = useContext(AuthContext);
    const [state, dispatch] = useReducer(reducer, initialState);
    const {
        cityBreaks,
        fetching,
        fetchingError,
        saving,
        savingError,
        deleting,
        deletingError,
        oldCityBreak
    } = state;
    useEffect(getCityBreaksEffect, [token]);
    useEffect(wsEffect, [token]);

    const saveCityBreak = useCallback<SaveCityBreakFn>(saveCityBreakCallback, [token]);

    const deleteCityBreak = useCallback<DeleteCityBreakFn>(deleteCityBreakCallback, [token]);

    const updateServer = useCallback<UpdateServerFn>(updateServerCallback, [
        token,
    ]);

    const getServerCityBreak = useCallback<ServerCityBreak>(cityBreakServer, [token]);

    const value = {
        cityBreaks,
        fetching,
        fetchingError,
        saving,
        savingError,
        saveCityBreak,
        deleting,
        deleteCityBreak,
        deletingError,
        updateServer,
        getServerCityBreak,
        oldCityBreak
    };


    log("returns");
    return <CityBreakContext.Provider value={value}>{children}</CityBreakContext.Provider>;


    async function cityBreakServer(id: string, version: number) {
        const oldCityBreak = await getCityBreak(token, id);
        if (oldCityBreak.version !== version) {
            dispatch({type: CONFLICT, payload: {cityBreak: oldCityBreak}});
        }
    }

    async function updateServerCallback() {
        const allKeys = Storage.keys();
        let promisedCityBreaks;
        var i;

        promisedCityBreaks = await allKeys.then(function (allKeys) {
            const promises = [];
            for (i = 0; i < allKeys.keys.length; i++) {
                const promiseCityBreak = Storage.get({key: allKeys.keys[i]});

                promises.push(promiseCityBreak);
            }
            return promises;
        });

        for (i = 0; i < promisedCityBreaks.length; i++) {
            const promise = promisedCityBreaks[i];
            const cityBreak = await promise.then(function (it) {
                var object;
                try {
                    object = JSON.parse(it.value!);
                } catch (e) {
                    return null;
                }
                return object;
            });
            log("CityBreak: " + JSON.stringify(cityBreak));
            if (cityBreak !== null) {
                if (cityBreak.status === 1) {
                    dispatch({type: DELETE_ITEM_SUCCEEDED, payload: {cityBreak: cityBreak}});
                    await Storage.remove({key: cityBreak._id});
                    const oldCityBreak = cityBreak;
                    delete oldCityBreak._id;
                    oldCityBreak.status = 0;
                    const newCityBreak = await createCityBreak(token, oldCityBreak);
                    dispatch({type: SAVE_ITEM_SUCCEEDED, payload: {cityBreak: newCityBreak}});
                    await Storage.set({
                        key: JSON.stringify(newCityBreak._id),
                        value: JSON.stringify(newCityBreak),
                    });
                } else if (cityBreak.status === 2) {
                    cityBreak.status = 0;
                    const newCityBreak = await updateCityBreak(token, cityBreak);
                    dispatch({type: SAVE_ITEM_SUCCEEDED, payload: {cityBreak: newCityBreak}});
                    await Storage.set({
                        key: JSON.stringify(newCityBreak._id),
                        value: JSON.stringify(newCityBreak),
                    });
                } else if (cityBreak.status === 3) {
                    cityBreak.status = 0;
                    await eraseCityBreak(token, cityBreak);
                    await Storage.remove({key: cityBreak._id});
                }
            }
        }
    }


    function getCityBreaksEffect() {
        let canceled = false;
        fetchCityBreaks();
        return () => {
            canceled = true;
        };

        async function fetchCityBreaks() {
            if (!token?.trim()) {
                return;
            }
            try {
                log("fetchCityBreaks started");
                dispatch({type: FETCH_ITEMS_STARTED});
                const cityBreaks = await getCityBreaks(token);
                log("fetchCityBreaks succeeded");
                if (!canceled) {
                    dispatch({type: FETCH_ITEMS_SUCCEEDED, payload: {cityBreaks}});
                }
            } catch (error) {
                const allKeys = Storage.keys();
                console.log(allKeys);
                let promisedCityBreaks;
                var i;

                promisedCityBreaks = await allKeys.then(function (allKeys) {

                    const promises = [];
                    for (i = 0; i < allKeys.keys.length; i++) {
                        const promiseCityBreak = Storage.get({key: allKeys.keys[i]});

                        promises.push(promiseCityBreak);
                    }
                    return promises;
                });

                const cityBreaks_aux = [];
                for (i = 0; i < promisedCityBreaks.length; i++) {
                    const promise = promisedCityBreaks[i];
                    const cityBreak = await promise.then(function (it) {
                        var object;
                        try {
                            object = JSON.parse(it.value!);
                        } catch (e) {
                            return null;
                        }
                        console.log(typeof object);
                        console.log(object);
                        if (object.status !== 2) {
                            return object;
                        }
                        return null;
                    });
                    if (cityBreak != null) {
                        cityBreaks_aux.push(cityBreak);
                    }
                }

                const cityBreaks = cityBreaks_aux;
                dispatch({type: FETCH_ITEMS_SUCCEEDED, payload: {cityBreaks: cityBreaks}});
            }
        }
    }

    function random_id() {
        return "_" + Math.random().toString(36).substr(2, 9);
    }


    async function saveCityBreakCallback(cityBreak: CityBreakProps, connected: boolean) {
        try {
            if (!connected) {
                throw new Error();
            }
            log("saveCityBreak started");
            dispatch({type: SAVE_ITEM_STARTED});
            const savedCityBreak = await (cityBreak._id
                ? updateCityBreak(token, cityBreak)
                : createCityBreak(token, cityBreak));

            log("saveCityBreak succeeded");
            dispatch({type: SAVE_ITEM_SUCCEEDED, payload: {cityBreak: savedCityBreak}});
            dispatch({type: CONFLICT_SOLVED});
        } catch (error) {
            log("saveCityBreak failed with errror:", error);

            if (cityBreak._id === undefined) {
                cityBreak._id = random_id();
                cityBreak.status = 1;
            } else {
                cityBreak.status = 2;
                alert("CityBreak updated locally");
            }
            await Storage.set({
                key: cityBreak._id,
                value: JSON.stringify(cityBreak),
            });

            dispatch({type: SAVE_ITEM_SUCCEEDED_OFFLINE, payload: {cityBreak: cityBreak}});
        }
    }

    async function deleteCityBreakCallback(cityBreak: CityBreakProps, connected: boolean) {
        try {
            if (!connected) {
                throw new Error();
            }
            dispatch({type: DELETE_ITEM_STARTED});
            const deletedCityBreak = await eraseCityBreak(token, cityBreak);
            console.log(deletedCityBreak);
            await Storage.remove({key: cityBreak._id!});
            dispatch({type: DELETE_ITEM_SUCCEEDED, payload: {cityBreak: cityBreak}});
        } catch (error) {

            cityBreak.status = 3;
            await Storage.set({
                key: JSON.stringify(cityBreak._id),
                value: JSON.stringify(cityBreak),
            });
            alert("CityBreak deleted locally");
            dispatch({type: DELETE_ITEM_SUCCEEDED, payload: {cityBreak: cityBreak}});
        }
    }

    function wsEffect() {
        let canceled = false;
        log("wsEffect - connecting");
        let closeWebSocket: () => void;
        if (token?.trim()) {
            closeWebSocket = newWebSocket(token, message => {
                if (canceled) {
                    return;
                }
                const {type} = message;
                log(`ws message, cityBreak ${type}`);
                if (type === "created" || type === "updated") {
                    //dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { cityBreak } });
                }
            });
        }
        return () => {
            log("wsEffect - disconnecting");
            canceled = true;
            closeWebSocket?.();
        };
    }

};