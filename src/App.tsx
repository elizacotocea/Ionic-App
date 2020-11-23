import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import {PrivateRoute} from "./auth/PrivateRoute";
import {Login} from "./auth/Login";
import {AuthProvider} from "./auth/AuthProvider";
import {CitybreakList, CitybreakEdit} from "./citybreak";
import {CitybreakProvider} from "./citybreak/CitybreakProvider";

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
          <AuthProvider>
              <Route path="/login" component={Login} exact={true}/>
              <CitybreakProvider>
                  <PrivateRoute path="/citybreaks" component={CitybreakList} exact={true}/>
                  <PrivateRoute path="/citybreak" component={CitybreakEdit} exact={true}/>
                  <PrivateRoute path="/citybreak/:id" component={CitybreakEdit} exact={true}/>
              </CitybreakProvider>
              <Route exact path="/" render={() => <Redirect to="/citybreaks"/>}/>
          </AuthProvider>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
