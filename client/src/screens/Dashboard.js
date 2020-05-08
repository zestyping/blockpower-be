import React from "react";
import { Text, View } from 'react-native';

import { Heading, MediumText } from "../components/Type";
import { ViewCenter, ViewFlex, Row, Space } from '../components/Layout';
import { Button } from "../components/Buttons";
import * as storage from '../lib/storage';
import { Link } from '../App/routing';

export const Dashboard = ({ refer }) => {
  const { user } = refer.state;

  return (
    <View>
      <Heading>Welcome, {user.name}</Heading>
      <Space />
      <ViewCenter>
        <MediumText>You've knocked on 14 doors.</MediumText>
        <MediumText>You've sent 18 postcards.</MediumText>
        <MediumText>You've made 35 phone calls.</MediumText>
      </ViewCenter>
      <ViewFlex />
      <Heading>What do you want to do?</Heading>
      <Row>
        <ViewFlex>
          <Button>
            Phone Banking
          </Button>
          <Button>
            Post Cards
          </Button>
        </ViewFlex>
        <ViewFlex>
          <Button to="/canvassing">
            Canvassing
          </Button>
          <Button>
            Your Reps
          </Button>
        </ViewFlex>
      </Row>
      <Button to="/settings" title="Settings" />
      <Button
        title="Logout"
        alt={true}
        onPress={() => {
          storage.del('jwt');
          refer.setState({user: null});
        }}
      />
    </View>
  );
};
