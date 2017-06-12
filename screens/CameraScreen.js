import React from 'react';
import {
  ActivityIndicator,
  Button,
  Clipboard,
  Image,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Constants,
  ImagePicker,
  registerRootComponent,
} from 'expo';
import { Ionicons } from '@expo/vector-icons';
import { COLOR_BEIGE, COLOR_BLUE } from '../components/styles/common'

@registerRootComponent
export default class App extends React.Component {
  state = {
    image: null,
    uploading: false,
  }

  render() {
    let { image } = this.state;

    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>

        <View style={[styles.selectPhoto, styles.photo]}>
          <Ionicons name="ios-image-outline" size={32} color="#fff" />

          <Button
            onPress={this._selectPhoto}
            color="#fff"
            title="Select photo"
          />
        </View>

        <View style={[styles.takePhoto, styles.photo]}>
          <Ionicons name="ios-aperture-outline" size={32} color="#fff" />

          <Button
            onPress={this._takePhoto}
            color="#fff"
            title="Take photo"
          />
        </View>

        { this._maybeRenderImage() }
        { this._maybeRenderUploadingOverlay() }

        <StatusBar barStyle="default" />
      </View>
    );
  }

  _maybeRenderUploadingOverlay = () => {
    if (this.state.uploading) {
      return (
        <View style={[StyleSheet.absoluteFill, {backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center'}]}>
          <ActivityIndicator
            color="#fff"
            animating
            size="large"
          />
        </View>
      );
    }
  }

  _maybeRenderImage = () => {
    let { image } = this.state;
    if (!image) {
      return;
    }

    return (
      <View style={{
        marginTop: 30,
        width: 250,
        borderRadius: 3,
        elevation: 2,
        shadowColor: 'rgba(0,0,0,1)',
        shadowOpacity: 0.2,
        shadowOffset: {width: 4, height: 4},
        shadowRadius: 5,
      }}>
        <View style={{borderTopRightRadius: 3, borderTopLeftRadius: 3, overflow: 'hidden'}}>
          <Image
            source={{uri: image}}
            style={{width: 250, height: 250}}
          />
        </View>

        <Text
          onPress={this._copyToClipboard}
          onLongPress={this._share}
          style={{paddingVertical: 10, paddingHorizontal: 10}}>
          {image}
        </Text>
      </View>
    );
  }

  _renderIcon(name, isSelected) {
    return (
      <Ionicons
        name={name}
        size={32}
        color={isSelected ? Colors.tabIconSelected : Colors.tabIconDefault}
      />
    );
  }

  _share = () => {
    Share.share({
      message: this.state.image,
      title: 'Check out this photo',
      url: this.state.image,
    });
  }

  _copyToClipboard = () => {
    Clipboard.setString(this.state.image);
    alert('Copied image URL to clipboard');
  }

  _takePhoto = async () => {
    let pickerResult = await ImagePicker.launchCameraAsync({
      aspect: [4,3]
    });

    this._handleImagePicked(pickerResult);
  }

  _selectPhoto = async () => {
    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      aspect: [4,3]
    });

    this._handleImagePicked(pickerResult);
  }

  _handleImagePicked = async (pickerResult) => {
    let uploadResponse, uploadResult;

    try {
      this.setState({uploading: true});

      if (!pickerResult.cancelled) {
        uploadResponse = await uploadImageAsync(pickerResult.uri);
        uploadResult = await uploadResponse.json();
        this.setState({image: uploadResult.location});
      }
    } catch(e) {
      console.log({uploadResponse});
      console.log({uploadResult});
      console.log({e});
      alert('Upload failed, sorry :(');
    } finally {
      this.setState({uploading: false});
    }
  }
}

const styles = StyleSheet.create({
  photo: {
    padding: 10,
    paddingVertical: 30,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectPhoto: {
    backgroundColor: COLOR_BEIGE,
  },
  takePhoto: {
    backgroundColor: COLOR_BLUE,
  },
})

async function uploadImageAsync(uri) {
  let apiUrl = 'https://file-upload-example-backend-dkhqoilqqn.now.sh/upload';

  // Note:
  // Uncomment this if you want to experiment with local server
  //
  // if (Constants.isDevice) {
  //   apiUrl = `https://your-ngrok-subdomain.ngrok.io/upload`;
  // } else {
  //   apiUrl = `http://localhost:3000/upload`
  // }

  let uriParts = uri.split('.');
  let fileType = uri[uri.length - 1];

  let formData = new FormData();
  formData.append('photo', {
    uri,
    name: `photo.${fileType}`,
    type: `image/${fileType}`,
  });

  let options = {
    method: 'POST',
    body: formData,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'multipart/form-data',
    },
  };

  return fetch(apiUrl, options);
}