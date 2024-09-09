import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';

import React, {useContext, useEffect, useState} from 'react';
import RegularBG from '../../../../components/background/RegularBG';
import BackButton from '../../../../components/buttons/BackButton';
import ActionButton from '../../../../components/buttons/ActionButton';
import {SCREENS} from '../../../../constants/screens/screen';
import SmallTextInput from '../../../../components/inputs/SmallTextInput';
import {COLORS, FONTS} from '../../../../constants/theme/theme';
import StartDateSelection from '../../../../components/calendar/StartDateSelection';
import EndDateSelection from '../../../../components/calendar/EndDateSelection';
import Toast from 'react-native-toast-message';
import {AuthContext} from '../../../../context/AuthContext';
import axios from 'axios';
import {ENDPOINT} from '../../../../constants/endpoints/endpoints';

var plus = require('../../../../../assets/Images/plus.png');
var close = require('../../../../../assets/Images/close.png');

function DestinationInput({tripDestinations, setTripDestinations}) {
  const addDestination = () => {
    setTripDestinations([...tripDestinations, '']);
  };

  const removeDestination = index => {
    const updatedDestinations = [...tripDestinations];
    updatedDestinations.splice(index, 1);
    setTripDestinations(updatedDestinations);
  };

  const handleTextChange = (text, index) => {
    const updatedDestinations = [...tripDestinations];
    updatedDestinations[index] = text;
    setTripDestinations(updatedDestinations);
  };

  return (
    <View style={{gap: 8}}>
      <Text style={styles.label}>Trip Destination</Text>
      <View style={{gap: 8}}>
        {tripDestinations.map((destination, index) => (
          <View
            key={index}
            style={
              index !== 0 ? styles.multiDestination : styles.singleDestination
            }>
            <SmallTextInput
              placeholder="Trip Destination"
              value={destination}
              onChangeText={text => {
                const capitalizedText =
                  text.charAt(0).toUpperCase() + text.slice(1);

                handleTextChange(capitalizedText, index);
              }}
            />
            {tripDestinations.length > 1 && (
              <TouchableOpacity onPress={() => removeDestination(index)}>
                <Image source={close} style={{width: 24, height: 24}} />
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity
          style={styles.addDestination}
          onPress={addDestination}>
          <Image source={plus} style={{width: 24, height: 24}} />
          <Text style={styles.addDestinationTextStyle}>Add Destination</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const EditTrip = ({navigation, route}) => {
  const {tripData} = route.params;

  const {myUserDetails, authToken} = useContext(AuthContext);

  const [tripName, setTripName] = useState('');
  const [tripDestinations, setTripDestinations] = useState(['']);
  const [tripStartDate, setTripStartDate] = useState('');
  const [tripEndDate, setTripEndDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCalendar2, setShowCalendar2] = useState(false);
  const [charsLeft, setCharsLeft] = useState(25);
  const [fundGoals, setFundGoals] = useState('');
  useEffect(() => {
    setTripName(tripData?.trip?.trip_name);
    setTripDestinations(tripData?.trip?.destination);
    setTripStartDate(tripData?.trip?.trip_starting_time);
    setTripEndDate(tripData?.trip?.trip_ending_time);
    setFundGoals(formatCurrency(tripData?.trip?.fund_goals?.toString()));
  }, []);

  const [loading, setIsLoading] = useState(false);

  const handleTripNameChange = text => {
    const maxLength = 25;
    if (text.length <= maxLength) {
      const remainingChars = maxLength - text.length;
      const capitalizedText = text.charAt(0).toUpperCase() + text.slice(1);
      setTripName(capitalizedText);
      setCharsLeft(remainingChars);
    }
  };

  function PickStartDate(day) {
    setTripStartDate(day.dateString);
  }

  function PickEndDate(day) {
    setTripEndDate(day.dateString);
  }

  const formatCurrency = value => {
    let formattedValue = value.replace(/[^0-9]/g, '');

    if (formattedValue === '') {
      return '';
    }

    formattedValue = formattedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return `$ ${formattedValue}`;
  };

  const removeFormatting = formattedValue => {
    let unformattedValue = formattedValue.replace(/[$,]/g, '');
    return parseInt(unformattedValue, 10) || 0; // Return 0 if the string is empty
  };

  function handleFundText(value) {
    setFundGoals(formatCurrency(value));
  }

  function handleValidation() {
    const emptyDestinations = tripDestinations.filter(
      destination => destination.trim() === '',
    );

    if (tripName == '') {
      Toast.show({
        type: 'error',
        text2: 'Please enter Trip Name',
      });
    } else if (emptyDestinations.length > 0) {
      Toast.show({
        type: 'error',
        text2: 'Please enter Trip Destination',
      });
    } else if (tripStartDate == '') {
      Toast.show({
        type: 'error',
        text2: 'Please select Trip Start Date',
      });
    } else if (tripEndDate == '') {
      Toast.show({
        type: 'error',
        text2: 'Please select Trip End Date',
      });
    } else if (fundGoals == '') {
      Toast.show({
        type: 'error',
        text2: 'Please enter Trip Funds',
      });
    } else {
      UpdateTrip();
    }
  }

  // console.log(tripData.trip._id)

  function UpdateTrip() {
    setIsLoading(true);

    let formData = new FormData();

    // Append regular form data
    formData.append('trip_name', tripName);
    formData.append('trip_starting_time', tripStartDate);
    formData.append('trip_ending_time', tripEndDate);
    formData.append('owner', myUserDetails?.user?._id);
    formData.append('fund_goals', removeFormatting(fundGoals));

    // Append array data with indices for destinations
    tripDestinations.forEach((data, index) => {
      formData.append(`destination[${index}]`, data);
    });

    axios({
      method: 'PUT',
      url: `${ENDPOINT.UPDATE_TRIP}/${tripData?.trip?._id}`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: 'Bearer ' + authToken,
      },
    })
      .then(res => {
        console.log('Trip Updated Successfully,');
        navigation.goBack();
      })
      .catch(err => {
        console.log('Failed to update Trip', err.response.data);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <RegularBG>
      <View style={{marginTop: 14, marginBottom: 14}}>
        <BackButton title={'Create Trip'} onPress={() => navigation.goBack()} />
      </View>

      <ScrollView style={{marginTop: 14}} showsVerticalScrollIndicator={false}>
        <View style={{gap: 24}}>
          <View style={{gap: 8}}>
            <Text style={styles.label}>Trip Name</Text>
            <SmallTextInput
              placeholder={'Trip Name'}
              value={tripName}
              onChangeText={handleTripNameChange}
            />
            <Text style={styles.charsLeft}>{charsLeft} characters left</Text>
          </View>

          <DestinationInput
            tripDestinations={tripDestinations}
            setTripDestinations={setTripDestinations}
          />

          <View style={{gap: 8}}>
            <Text style={styles.label}>Trip Period</Text>
            <TouchableOpacity
              style={styles.tripPeriod}
              onPress={() => setShowCalendar(true)}>
              <Text
                style={
                  tripStartDate == '' && tripEndDate == ''
                    ? styles.tripPeriodTextPlace
                    : styles.tripPeriodText
                }>
                {tripStartDate == '' && tripEndDate == ''
                  ? 'Trip Period'
                  : `${new Date(tripStartDate).toDateString()} - ${new Date(
                      tripEndDate,
                    ).toDateString()}`}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{gap: 8}}>
            <Text style={styles.label}>Buddies</Text>
          </View>

          <View style={{gap: 8}}>
            <Text style={styles.label}>Fund Goals</Text>
            <SmallTextInput
              placeholder={'$ Fund Goals'}
              keyboardType="numeric"
              value={fundGoals}
              onChangeText={handleFundText}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionBtn}>
        <ActionButton
          title={'Create Trip'}
          onPress={handleValidation}
          loading={loading}
        />
      </View>

      <StartDateSelection
        showCalendar={showCalendar}
        setShowCalendar={setShowCalendar}
        setShowCalendar2={setShowCalendar2}
        PickStartDate={PickStartDate}
        PickEndDate={PickEndDate}
        tripStartDate={tripStartDate}
      />

      <EndDateSelection
        showCalendar2={showCalendar2}
        setShowCalendar2={setShowCalendar2}
        tripStartDate={tripStartDate}
        tripEndDate={tripEndDate}
        PickEndDate={PickEndDate}
      />
    </RegularBG>
  );
};

export default EditTrip;

const styles = StyleSheet.create({
  actionBtn: {
    marginTop: 14,
    marginBottom: 14,
  },
  label: {
    color: '#f2f2f2',
    fontFamily: FONTS.MAIN_SEMI,
    fontSize: 13,
  },
  multiDestination: {
    width: '91%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  singleDestination: {
    // marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addDestination: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addDestinationTextStyle: {
    fontFamily: FONTS.MAIN_REG,
    fontSize: 14,
    color: 'white',
  },
  charsLeft: {
    color: COLORS.VISION,
    fontFamily: FONTS.MAIN_SEMI,
    fontSize: 11,
    textAlign: 'right',
  },
  tripPeriod: {
    width: '100%',
    backgroundColor: COLORS.GREY_LIGHT,
    height: 50,
    borderRadius: 100,
    justifyContent: 'center',
    paddingLeft: 16,
    paddingRight: 16,
  },
  tripPeriodTextPlace: {
    fontSize: 14,
    fontFamily: FONTS.MAIN_REG,
    color: COLORS.VISION,
  },
  tripPeriodText: {
    fontSize: 14,
    fontFamily: FONTS.MAIN_REG,
    color: COLORS.LIGHT,
  },
});
