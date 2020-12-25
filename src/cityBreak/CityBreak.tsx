import React from 'react';
import {IonItem, IonLabel} from '@ionic/react';
import {CityBreakProps} from './CityBreakProps';

interface ItemPropsExt extends CityBreakProps {
    onEdit: (_id?: string) => void;
}

const CityBreak: React.FC<ItemPropsExt> = ({_id, name, price, onEdit}) => {
    return (
        <IonItem onClick={() => onEdit(_id)}>
            <IonLabel>{name} - {price}$ </IonLabel>
        </IonItem>
    );
};

export default CityBreak;