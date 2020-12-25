import React, {useContext, useEffect, useState} from 'react';
import Moment from 'moment'
import {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput, IonItem,
    IonLoading,
    IonPage,
    IonTitle,
    IonToolbar,
    IonLabel,
    IonDatetime,
    IonCheckbox
} from '@ionic/react';
import {getLogger} from '../core';
import {CityBreakContext} from './CityBreakProvider';
import {RouteComponentProps} from 'react-router';
import {CityBreakProps} from './CityBreakProps';
import {AuthContext} from "../auth";
import {useNetwork} from "./useNetwork";

const log = getLogger('CityBreakEdit');

interface CityBreakEditProps extends RouteComponentProps<{
    id?: string;
}> {
}

export const CityBreakEdit: React.FC<CityBreakEditProps> = ({history, match}) => {
    const {cityBreaks, saving, savingError, saveCityBreak, deleteCityBreak, getServerCityBreak, oldCityBreak} = useContext(CityBreakContext);
    const {networkStatus} = useNetwork();
    const [itemV2, setItemV2] = useState<CityBreakProps>();
    const [status, setStatus] = useState(1);
    const [version, setVersion] = useState(-100);
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [price, setPrice] = useState(0);
    const [transportIncluded, setTransportIncluded] = useState(false);
    const [cityBreak, setCityBreak] = useState<CityBreakProps>();
    const {_id} = useContext(AuthContext);
    const [userId, setUserId] = useState(_id);


    useEffect(() => {
        setItemV2(oldCityBreak);
        log("setOldItem: " + JSON.stringify(oldCityBreak));
    }, [oldCityBreak]);


    useEffect(() => {
        log('useEffect');
        const routeId = match.params.id || '';
        const cityBreak = cityBreaks?.find((it) => it._id === routeId);
        setCityBreak(cityBreak);
        if (cityBreak) {
            setName(cityBreak.name);
            setStartDate(cityBreak.startDate);
            setEndDate(cityBreak.endDate);
            setPrice(cityBreak.price);
            setTransportIncluded(cityBreak.transportIncluded);
            setStatus(cityBreak.status);
            setVersion(cityBreak.version);
            getServerCityBreak && getServerCityBreak(match.params.id!, cityBreak?.version);

        }
    }, [match.params.id, cityBreaks, getServerCityBreak]);


    const handleSave = () => {
        const editedCityBreak = cityBreak ? {
            ...cityBreak,
            name,
            startDate,
            endDate,
            price,
            transportIncluded,
            userId,
            status: 0,
            version: cityBreak.version ? cityBreak.version + 1 : 1
        } : {name, startDate, endDate, price, transportIncluded, userId, status: 0, version: 1};
        saveCityBreak && saveCityBreak(editedCityBreak,
            networkStatus.connected
        ).then(() => {
            if (itemV2 === undefined) history.goBack();
        });
    }


    const handleConflict_keepVersion = () => {
        if (oldCityBreak) {
            const editedItem = {
                ...cityBreak,
                name,
                startDate,
                endDate,
                price,
                transportIncluded,
                userId,
                status: 0,
                version: oldCityBreak?.version + 1
            };
            saveCityBreak && saveCityBreak(editedItem, networkStatus.connected).then(() => {
                history.goBack();
            });
        }
    };


    const handleConflict_updateVersion = () => {
        if (oldCityBreak) {
            const editedItem = {
                ...cityBreak,
                name: oldCityBreak?.name,
                startDate: oldCityBreak?.startDate,
                endDate: oldCityBreak?.endDate,
                price: oldCityBreak?.price,
                transportIncluded: oldCityBreak?.transportIncluded,
                userId: oldCityBreak?.userId,
                status: oldCityBreak?.status,
                version: oldCityBreak?.version
            };
            saveCityBreak && editedItem && saveCityBreak(editedItem, networkStatus.connected).then(() => {
                history.goBack();
            });
        }
    };


    const handleDelete = () => {
        const deletedCityBreak = cityBreak
            ? {...cityBreak, name, startDate, endDate, price, transportIncluded, userId, status: 0, version: 0}
            : {name, startDate, endDate, price, transportIncluded, userId, status: 0, version: 0};
        deleteCityBreak && deleteCityBreak(deletedCityBreak, networkStatus.connected).then(() => history.goBack());
    };
    log('render');

    if (itemV2) {
        return (
            <IonPage>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Edit</IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={handleSave}>Save</IonButton>
                            <IonButton onClick={handleDelete}>Delete</IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <IonItem>
                        <IonLabel>City name: </IonLabel>
                        <IonInput
                            value={name}
                            onIonChange={(e) => setName(e.detail.value || "")}
                        />
                    </IonItem>
                    <IonItem>
                        <IonLabel>Price</IonLabel>
                        <IonInput
                            value={price}
                            onIonChange={(e) => setPrice(Number(e.detail.value))}
                        />
                    </IonItem>

                    <IonItem>
                        <IonLabel>Transport included: </IonLabel>
                        <IonCheckbox
                            checked={transportIncluded}
                            onIonChange={(e) => setTransportIncluded(e.detail.checked)}
                        />
                    </IonItem>
                    <IonLabel>Start date: </IonLabel>
                    <IonDatetime value={Moment(new Date(startDate)).format('MM/DD/YYYY')}
                                 onIonChange={e => setStartDate(e.detail.value ? new Date(e.detail.value) : new Date())}/>
                    <IonLabel>End date: </IonLabel>
                    <IonDatetime value={Moment(new Date(endDate)).format('MM/DD/YYYY')}
                                 onIonChange={e => setEndDate(e.detail.value ? new Date(e.detail.value) : new Date())}/>


                    {itemV2 && (
                        <>
                            <IonItem>
                                <IonLabel>City name: {itemV2.name}</IonLabel>
                            </IonItem>
                            <IonItem>
                                <IonLabel>Price: {itemV2.price}</IonLabel>
                            </IonItem>
                            <IonItem>
                                <IonLabel>Transport included: {itemV2.transportIncluded}</IonLabel>
                            </IonItem>

                            <IonItem>
                                <IonLabel>Start date: {itemV2.startDate}</IonLabel>
                            </IonItem>

                            <IonItem>
                                <IonLabel>End date: {itemV2.endDate}</IonLabel>
                            </IonItem>

                            <IonButton onClick={handleConflict_keepVersion}>Keep your version</IonButton>
                            <IonButton onClick={handleConflict_updateVersion}>Update to new version</IonButton>
                        </>
                    )}


                    <IonLoading isOpen={saving}/>
                    {savingError && (
                        <div>{savingError.message || "Failed to save cityBreak"}</div>
                    )}
                </IonContent>
            </IonPage>
        );
    } else {
        return (
            <IonPage>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Edit</IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={handleSave}>Save</IonButton>
                            <IonButton onClick={handleDelete}>Delete</IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <IonItem>
                        <IonLabel>City name: </IonLabel>
                        <IonInput
                            value={name}
                            onIonChange={(e) => setName(e.detail.value || "")}
                        />
                    </IonItem>
                    <IonItem>
                        <IonLabel>Price</IonLabel>
                        <IonInput
                            value={price}
                            onIonChange={(e) => setPrice(Number(e.detail.value))}
                        />
                    </IonItem>

                    <IonItem>
                        <IonLabel>Transport included: </IonLabel>
                        <IonCheckbox
                            checked={transportIncluded}
                            onIonChange={(e) => setTransportIncluded(e.detail.checked)}
                        />
                    </IonItem>
                    <IonLabel>Start date: </IonLabel>
                    <IonDatetime value={Moment(new Date(startDate)).format('MM/DD/YYYY')}
                                 onIonChange={e => setStartDate(e.detail.value ? new Date(e.detail.value) : new Date())}/>
                    <IonLabel>End date: </IonLabel>
                    <IonDatetime value={Moment(new Date(endDate)).format('MM/DD/YYYY')}
                                 onIonChange={e => setEndDate(e.detail.value ? new Date(e.detail.value) : new Date())}/>


                    <IonLoading isOpen={saving}/>
                    {savingError && (
                        <div>{savingError.message || "Failed to save item"}</div>
                    )}

                </IonContent>
            </IonPage>
        );
    }
};
export default CityBreakEdit;
