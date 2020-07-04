import React, { Component } from 'react';

import { geocodeByAddress, getLatLng } from 'react-places-autocomplete';
import Select from 'react-select';

import Button from '@material-ui/core/Button';

import {
  notify_error,
  notify_success,
  _fetch,
  PlacesAutocomplete,
} from '../../common.js';

import { CardTurf } from '../Turf';
import { CardForm } from '../Forms';

import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
TimeAgo.locale(en);

const NEARBY_DIST = 50;

export const CardVolunteerFull = props => (
  <div>
    <br />
    {props.volunteer.first_name}
    {props.volunteer.approved ? (
      <Button
        onClick={() => props.refer._approveVolunteer(props.volunteer, true)}
      >
        Approve
      </Button>
    ) : (
      <Button onClick={() => props.refer._approveVolunteer(props.volunteer, false)}>
        Deny
      </Button>
    )}
    <br />
    Approved: {props.volunteer.approved ? "Approved!" : "Not Approved"}
    <br />
    Email: {props.volunteer.email ? props.volunteer.email : 'N/A'}
    <br />
    Phone: {props.volunteer.phone ? props.volunteer.phone : 'N/A'}
    <br />
    Address:{' '}
    <VolunteerAddress global={global} refer={props.refer} volunteer={props.volunteer} />
    <br />
      {props.volunteer.address.address1}
  <br />
      {props.volunteer.address.city}
  <br />
      {props.volunteer.address.state}
  <br />
      {props.volunteer.address.zip}
    <br />
    <br />
  </div>
);

export class VolunteerAddress extends Component {
  constructor(props) {
    super(props);
    this.state = {
      global: props.global,
      edit: false,
      address: this.props.volunteer.locationstr
        ? this.props.volunteer.locationstr
        : ''
    };
    this.onTypeAddress = address => this.setState({ address });
  }

  submitAddress = async address => {
    const { global } = this.state;

    this.setState({ address });
    try {
      let res = await geocodeByAddress(address);
      let pos = await getLatLng(res[0]);
      await _fetch(
        global,
        '/volunteer/update',
        'POST',
        {
          id: this.props.volunteer.id,
          address: address,
          lat: pos.lat,
          lng: pos.lng
        }
      );
      this.props.refer._loadData();
      notify_success('Address hass been saved.');
    } catch (e) {
      notify_error(e, 'Unable to update address info.');
    }
  };

  render() {
    if (this.state.edit)
      return (
        <PlacesAutocomplete
          debounce={500}
          value={this.state.address}
          onChange={this.onTypeAddress}
          onSelect={this.submitAddress}
        />
      );

    return (
      <div>
        {this.state.address}{' '}
      </div>
    );
  }
}
