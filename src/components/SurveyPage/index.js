import React, { PureComponent } from 'react';
import {
  Alert,
  Dimensions,
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
  FlatList,
  Keyboard,
  Text,
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';

import { getEpoch, getPropFromArrObj } from '../../common';

import storage from 'react-native-storage-wrapper';
import t from 'tcomb-form-native';
import sha1 from 'sha1';

var Form = t.form.Form;

const SAND = t.enums({
  'SA': 'Strongly Agree',
  'A': 'Agree',
  'N': 'Neutral',
  'D': 'Disagree',
  'SD': 'Strongly Disagree',
}, 'SAND');

var CanvassForm = t.struct({});
var options = {};

export default class App extends PureComponent {
  constructor(props) {
    super(props);

    const { state } = this.props.navigation;

    let values = {};

    for (let i in state.params.person.attrs) {
      if (state.params.person.attrs[i].value) {
        let type = getPropFromArrObj(state.params.form.attributes, state.params.person.attrs[i].id, 'type');
        if (type) {
          if (type === 'boolean') {
            if (state.params.person.attrs[i].value) values[state.params.person.attrs[i].id] = true;
            else values[state.params.person.attrs[i].id] = false;
          } else {
            values[state.params.person.attrs[i].id] = state.params.person.attrs[i].value;
          }
        }
      }
    };

    this.state = {
      refer: state.params.refer,
      funcs: state.params.funcs,
      form: state.params.form,
      marker: state.params.marker,
      place: state.params.place,
      unit: state.params.unit,
      person: state.params.person,
      values: values,
      start: getEpoch(),
    };

    this.onChange = this.onChange.bind(this);
    this.doSave = this.doSave.bind(this);

    this.edits = false;
    this.goBack = this.props.navigation.goBack;
    this.props.navigation.goBack = () => {
      if (this.edits) {
        Alert.alert(
          'Unsaved Form',
          'You have unsaved edits. Do you want to save your changes?',
          [
            {text: 'Discard Changes', onPress: () => { this.goBack();
            }},
            {text: 'Keep Editing'},
          ], { cancelable: false }
        );
      } else {
        this.goBack();
      }
    };

  }

  onChange(value) {
    this.edits = true;
  }

  doSave = async () => {
    const { funcs, refer, marker, place, unit, person } = this.state;

    let json = this.refs.form.getValue();
    if (json == null) return;

    refer.setState({updated: getEpoch()});
    funcs.sendVisit(marker.address.id, place, unit, person, this.state.start, json);

    // update local
    person.visit = true;

    let ids = Object.keys(json);
    for (let i in ids) {
      let found = false;
      person.attrs.forEach(a => {
        if (a.id === ids[i]) {
          found = true;
          a.value = json[ids[i]];
        }
      });
      // wasn't there? add it
      if (!found) person.attrs.push({id: ids[i], value: json[ids[i]]});
    }

    this.goBack();
  }

  valueToEnums(options) {
    let obj = {};
    for (let i in options)
      obj[options[i]] = options[i];
    return t.enums(obj);
  }

  render() {
    const { form } = this.state;

    let newStruct = {};
    let newOptions = {
      i18n: {
        optional: '',
        required: ' *',
      },
      fields: {},
    };

    form.attributes.forEach(a => {
      let value;
      let mode;
      let boxflag = false;
      switch (a.type) {
        case 'textbox': value = t.String; boxflag = true; break;
        case 'number': value = t.Number; break;
        case 'boolean': value = t.Boolean; break;
        case 'sand': value = SAND; break;
        //case 'date': value = t.Date; mode = 'date'; break;
        case 'string':
          if (a.values) {
            let matching = this.state.person.attrs.filter(i => i.id === a.id);
            value = this.valueToEnums(a.values.concat(matching.map(i => i.value)));
          } else {
            value = t.String;
          }
          break;
        default: value = t.String;
      }
      if (!a.required) value = t.maybe(value);
      if (!a.label) a.label = a.name;
      newStruct[a.id] = value;
      newOptions.fields[a.id] = { label: a.label };
      if (mode) newOptions.fields[a.id].mode = mode;
      if (a.readonly) {
        newOptions.fields[a.id].disabled = true;
        newOptions.fields[a.id].editable = false;
      }
      if (boxflag === true) {
        newOptions.fields[a.id].multiline = true;
        newOptions.fields[a.id].stylesheet = {
          ...Form.stylesheet,
          textbox: {
            ...Form.stylesheet.textbox,
            normal: {
              ...Form.stylesheet.textbox.normal,
              height: 150
            },
            error: {
              ...Form.stylesheet.textbox.error,
              height: 150
            }
          }
        };
      }
    });

    CanvassForm = t.struct(newStruct);
    options = newOptions;

    return (
      <ScrollView style={{flex: 1, backgroundColor: 'white'}}>

        <View style={styles.container}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Form
              ref="form"
              type={CanvassForm}
              options={options}
              value={this.state.values}
              onChange={this.onChange}
            />
          </TouchableWithoutFeedback>
        </View>

        <TouchableHighlight style={styles.button} onPress={this.doSave} underlayColor='#99d9f4'>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableHighlight>

        <View style={{width: Dimensions.get('window').width, height: 1, marginBottom: 250}} />

      </ScrollView>
    );
  }
}

var styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 30,
    alignSelf: 'center',
    marginBottom: 30
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    alignSelf: 'center'
  },
  button: {
    height: 36,
    backgroundColor: '#48BBEC',
    borderColor: '#48BBEC',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    alignSelf: 'stretch',
    justifyContent: 'center'
  }
});
