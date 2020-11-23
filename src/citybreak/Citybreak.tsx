import React from 'react';
import { IonItem, IonLabel } from '@ionic/react';
import { CitybreakProps } from './CitybreakProps';

interface ItemPropsExt extends CitybreakProps {
    onEdit: (_id?: string) => void;
}

const Citybreak: React.FC<ItemPropsExt> = ({ _id, name, onEdit }) => {
    return (
        <IonItem onClick={() => onEdit(_id)}>
            <IonLabel>{name}</IonLabel>
        </IonItem>
    );
};

export default Citybreak;