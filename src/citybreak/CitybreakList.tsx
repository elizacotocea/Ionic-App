import React, { useContext } from "react";
import { RouteComponentProps } from "react-router";
import {
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonList,
    IonLoading,
    IonPage,
    IonTitle,
    IonToolbar,
} from "@ionic/react";
import { add } from "ionicons/icons";
import Item from "./Citybreak";
import { getLogger } from "../core";
import { ItemContext } from "./CitybreakProvider";

const log = getLogger("CitybreakList");

const ItemList: React.FC<RouteComponentProps> = ({ history }) => {
    const { citybreaks, fetching, fetchingError } = useContext(ItemContext);
    log("render");
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Citybreaks List</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonLoading isOpen={fetching} message="Fetching citybreaks" />
                {citybreaks && (
                    <IonList>
                        {citybreaks.map(({ _id, name, startDate, endDate, price, transportIncluded }) => (
                            <Item
                                key={_id}
                                _id={_id}
                                name={name}
                                startDate={startDate}
                                endDate={endDate}
                                price={price}
                                transportIncluded={transportIncluded}
                                onEdit={(id:any) => history.push(`/citybreak/${id}`)}
                            />
                        ))}
                    </IonList>
                )}
                {fetchingError && (
                    <div>{fetchingError.message || "Failed to fetch items"}</div>
                )}
                <IonFab vertical="bottom" horizontal="end" slot="fixed">
                    <IonFabButton onClick={() => history.push("/citybreak")}>
                        <IonIcon icon={add} />
                    </IonFabButton>
                </IonFab>
            </IonContent>
        </IonPage>
    );
};

export default ItemList;
