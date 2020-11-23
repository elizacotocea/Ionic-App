import React, { useCallback, useContext, useEffect, useReducer } from "react";
import PropTypes from "prop-types";
import { getLogger } from "../core";
import { CitybreakProps } from "./CitybreakProps";
import {
    createCitybreak,
    getCitybreaks,
    newWebSocket,
    updateCitybreak,
    eraseCitybreak,
} from "./CitybreakApi";
import {AuthContext} from "../auth/AuthProvider";


const log = getLogger("ItemProvider");

type SaveCitybreakFn = (item: CitybreakProps) => Promise<any>;
type DeleteCitybreakFn = (item: CitybreakProps) => Promise<any>;

export interface CitybreaksState {
    citybreaks?: CitybreakProps[];
    fetching: boolean;
    fetchingError?: Error | null;
    saving: boolean;
    deleting: boolean;
    savingError?: Error | null;
    deletingError?: Error | null;
    saveItem?: SaveCitybreakFn;
    deleteItem?: DeleteCitybreakFn;
}

interface ActionProps {
    type: string;
    payload?: any;
}

const initialState: CitybreaksState = {
    fetching: false,
    saving: false,
    deleting: false,
};

const FETCH_CITYBREAKS_STARTED = "FETCH_CITYBREAKS_STARTED";
const FETCH_CITYBREAKS_SUCCEEDED = "FETCH_CITYBREAKS_SUCCEEDED";
const FETCH_CITYBREAKS_FAILED = "FETCH_CITYBREAKS_FAILED";
const SAVE_CITYBREAKS_STARTED = "SAVE_CITYBREAKS_STARTED";
const SAVE_CITYBREAKS_SUCCEEDED = "SAVE_CITYBREAKS_SUCCEEDED";
const SAVE_CITYBREAKS_FAILED = "SAVE_CITYBREAKS_FAILED";
const DELETE_CITYBREAKS_STARTED = "DELETE_CITYBREAKS_STARTED";
const DELETE_CITYBREAKS_SUCCEEDED = "DELETE_CITYBREAKS_SUCCEEDED";
const DELETE_CITYBREAKS_FAILED = "DELETE_CITYBREAKS_FAILED";

const reducer: (state: CitybreaksState, action: ActionProps) => CitybreaksState = (
    state,
    { type, payload }
) => {
    switch (type) {
        case FETCH_CITYBREAKS_STARTED:
            return { ...state, fetching: true, fetchingError: null };
        case FETCH_CITYBREAKS_SUCCEEDED:
            return { ...state, citybreaks: payload.items, fetching: false };
        case FETCH_CITYBREAKS_FAILED:
            return { ...state, fetchingError: payload.error, fetching: false };

        case SAVE_CITYBREAKS_STARTED:
            return { ...state, savingError: null, saving: true };
        case SAVE_CITYBREAKS_SUCCEEDED:
            const items = [...(state.citybreaks || [])];
            const item = payload.item;
            const index = items.findIndex((it) => it._id === item._id);
            console.log(items);
            if (index === -1) {
                items.splice(0, 0, item);
            } else {
                items[index] = item;
            }
            return { ...state, citybreaks: items, saving: false };

        case SAVE_CITYBREAKS_FAILED:
            return { ...state, savingError: payload.error, saving: false };

        case DELETE_CITYBREAKS_STARTED:
            return { ...state, deletingError: null, deleting: true };
        case DELETE_CITYBREAKS_SUCCEEDED: {
            const items = [...(state.citybreaks || [])];
            const item = payload.item;
            const index = items.findIndex((it) => it._id === item._id);
            items.splice(index, 1);
            return { ...state, citybreaks: items, deleting: false };
        }

        case DELETE_CITYBREAKS_FAILED:
            return { ...state, deletingError: payload.error, deleting: false };
        default:
            return state;
    }
};

export const ItemContext = React.createContext<CitybreaksState>(initialState);

interface ItemProviderProps {
    children: PropTypes.ReactNodeLike;
}

export const CitybreakProvider: React.FC<ItemProviderProps> = ({ children }) => {
    const { token } = useContext(AuthContext);
    const [state, dispatch] = useReducer(reducer, initialState);
    const {
        citybreaks,
        fetching,
        fetchingError,
        saving,
        savingError,
        deleting,
    } = state;
    useEffect(getItemsEffect, [token]);
    useEffect(wsEffect, [token]);
    const saveItem = useCallback<SaveCitybreakFn>(saveItemCallback, [token]);
    const deleteItem = useCallback<DeleteCitybreakFn>(deleteItemCallback, [token]);
    const value = {
        citybreaks,
        fetching,
        fetchingError,
        saving,
        savingError,
        saveItem,
        deleting,
        deleteItem,
    };
    log("returns");
    return <ItemContext.Provider value={value}>{children}</ItemContext.Provider>;

    function getItemsEffect() {
        let canceled = false;
        fetchItems();
        return () => {
            canceled = true;
        };

        async function fetchItems() {
            if (!token?.trim()) {
                return;
            }
            try {
                log("fetchCitybreaks started");
                dispatch({ type: FETCH_CITYBREAKS_STARTED });
                const items = await getCitybreaks(token);
                log("fetchCitybreaks succeeded");
                if (!canceled) {
                    dispatch({ type: FETCH_CITYBREAKS_SUCCEEDED, payload: { items } });
                }
            } catch (error) {
                log("fetchCitybreaks failed");
                dispatch({ type: FETCH_CITYBREAKS_FAILED, payload: { error } });
            }
        }
    }

    async function saveItemCallback(item: CitybreakProps) {
        try {
            log("saveCitybreak started");

            dispatch({ type: SAVE_CITYBREAKS_STARTED });
            const savedItem = await (item._id
                ? updateCitybreak(token, item)
                : createCitybreak(token, item));
            log("saveCitybreak succeeded");
            dispatch({ type: SAVE_CITYBREAKS_SUCCEEDED, payload: { item: savedItem } });
        } catch (error) {
            log("saveCitybreak failed");
            dispatch({ type: SAVE_CITYBREAKS_FAILED, payload: { error } });
        }
    }

    async function deleteItemCallback(item: CitybreakProps) {
        try {
            log("delete started");
            dispatch({ type: DELETE_CITYBREAKS_STARTED });
            const deletedItem = await eraseCitybreak(token, item);
            log("delete succeeded");
            console.log(deletedItem);
            dispatch({ type: DELETE_CITYBREAKS_SUCCEEDED, payload: { item: item } });
        } catch (error) {
            log("delete failed");
            dispatch({ type: DELETE_CITYBREAKS_FAILED, payload: { error } });
        }
    }

    function wsEffect() {
        let canceled = false;
        log("wsEffect - connecting");
        let closeWebSocket: () => void;
        if (token?.trim()) {
            closeWebSocket = newWebSocket(token, (message:any) => {
                if (canceled) {
                    return;
                }
                const { type, payload: item } = message;
                log(`ws message, item ${type}`);
            });
        }
        return () => {
            log("wsEffect - disconnecting");
            canceled = true;
            closeWebSocket?.();
        };
    }
};