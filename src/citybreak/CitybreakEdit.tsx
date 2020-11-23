import React, { useContext, useEffect, useState } from "react";
import Moment from 'moment'
import {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonLoading,
    IonPage,
    IonTitle,
    IonToolbar,
    IonCheckbox,
    IonLabel,
    IonItem,
    IonDatetime
} from "@ionic/react";
import { getLogger } from "../core";
import { ItemContext } from "./CitybreakProvider";
import { RouteComponentProps } from "react-router";
import { CitybreakProps } from "./CitybreakProps";

const log = getLogger("ItemEdit");

interface ItemEditProps
    extends RouteComponentProps<{
        id?: string;
    }> {}

const ItemEdit: React.FC<ItemEditProps> = ({ history, match }) => {
    const { citybreaks, saving, savingError, saveItem, deleteItem } = useContext(
        ItemContext
    );
    const [name, setName] = useState("");
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [price, setPrice] = useState(0);
    const [transportIncluded, setTransportIncluded]= useState(false);
    const [citybreak, setCitybreak] = useState<CitybreakProps>();
    useEffect(() => {
        log("useEffect");
        const routeId = match.params.id || "";
        const citybreak = citybreaks?.find((citybreak) => citybreak._id === routeId);
        setCitybreak(citybreak);
        if (citybreak) {
            setName(citybreak.name);
            setStartDate(citybreak.startDate);
            setEndDate(citybreak.endDate);
            setPrice(citybreak.price);
            setTransportIncluded(citybreak.transportIncluded);
        }
    }, [match.params.id, citybreaks]);
    const handleSave = () => {
        const editedCitybreak = citybreak
            ? { ...citybreak, name, startDate: startDate, endDate: endDate, price: price, transportIncluded: transportIncluded }
            : { name, startDate: startDate, endDate: endDate, price: price, transportIncluded: transportIncluded  };
        saveItem && saveItem(editedCitybreak).then(() => history.goBack());
    };
    const handleDelete = () => {
        const editedCitybreak = citybreak
            ? { ...citybreak, name, startDate: startDate, endDate: endDate, price: price, transportIncluded: transportIncluded }
            : { name, startDate: startDate, endDate: endDate, price: price, transportIncluded: transportIncluded  };
        deleteItem && deleteItem(editedCitybreak).then(() => history.goBack());
    };
    log("render");
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
                    <IonLabel>Name: </IonLabel>
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

                <IonLoading isOpen={saving} />
                {savingError && (
                    <div>{savingError.message || "Failed to save citybreak"}</div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default ItemEdit;
