import React from 'react';
import { Route, Switch } from 'react-router-dom';
import {
  Dashboard,
  Volunteers,
  Turf,
  Forms,
  QRCodes,
  Attributes,
  Map,
  ImportData,
  Queue,
  Analytics,
  Settings,
  Login,
  About,
  Payout
} from '../components';
import NoMatch from './NoMatch';

// <Routes />
/*
  Props
  {
    server: <server description>
  }
*/
export const Routes = ({ global, experimental }) => (
  <Switch>
    <Route exact={true} path="/" render={() => <Volunteers global={global} />} />
    <Route path="/volunteers/" render={() => <Volunteers global={global} />} />
    <Route path="/jwt/" render={props => <Login {...props} global={global} />} />
    {(experimental)&&
    <Route path="/import/" render={() => <ImportData global={global} />} />
    }
    <Route path="/queue/" render={() => <Queue global={global} />} />
    <Route path="/analytics/" render={() => <Analytics global={global} />} />
    <Route path="/settings/" render={() => <Settings global={global} />} />
    <Route path="/about/" render={() => <About global={global} />} />
    <Route path="/payout/" render={() => <Payout global={global} />} />
    <Route component={NoMatch} />
  </Switch>
);

export default Routes;
