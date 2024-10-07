import {
  Image,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  NativeModules,
  NativeEventEmitter,
} from "react-native";

import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
// import { manager } from "@/components/BleManager";
import { useEffect, useState } from "react";
import { View, TextField, Text, Button } from "react-native-ui-lib";
import { BleManager } from "react-native-ble-plx";
import useBLE from "@/hooks/useBle";
// import BleManager from "react-native-ble-manager";

// const BleManagerModule = NativeModules.BleManager;
// const BleManagerEmitter = new NativeEventEmitter(BleManagerModule);

// const manager = new BleManager();

// function scanAndConnect() {
//   manager.startDeviceScan(null, null, (error, device: any) => {
//     if (error) {
//       // Handle error (scanning will be stopped automatically)
//       return;
//     }

//     console.log("hereee", device.name);

//     // Check if it is a device you are looking for based on advertisement data
//     // or other criteria.
//     if (
//       (!!device && device.name === "BTCU:0000000214") ||
//       device.name === "SensorTag"
//     ) {
//       // Stop scanning as it's not necessary if you are scanning for one device.
//       manager.stopDeviceScan();

//       // Proceed with connection.
//       device
//         .connect()
//         .then(async (foundDevice: any) => {
//           const res = await foundDevice.discoverAllServicesAndCharacteristics();
//           // return foundDevice.services();

//           console.log("hereee", res);

//           return res;
//         })
//         .then((result: any) => {
//           // Do work on device with services and characteristics

//           console.log("all device information", result);
//           // manager.readCharacteristicForDevice;
//         })
//         .catch((error: any) => {
//           // Handle errors
//           console.log("all errors", error);
//         });

//       // const response = manager
//       //   .connectToDevice(device.id)
//       //   .then((device) => {
//       //     console.log("Connected to device:", device.name);

//       //     // Add your logic for handling the connected device

//       //     return device.discoverAllServicesAndCharacteristics();
//       //   })
//       //   .then((val) => console.log("returned val", val))
//       //   .catch((error) => {
//       //     // Handle errors
//       //     console.log("err", error);
//       //   });
//     }
//   });
// }

// const turnOn = () => {
//   console.log("Helloo");
//   const subscription = manager.onStateChange((state) => {
//     if (state === "PoweredOn") {
//       console.log("ON");
//       scanAndConnect();
//     }
//   }, true);
// };

export default function HomeScreen() {
  const [isScanning, setIsScanning] = useState(false);
  // const peripherals = new Map();
  // const [connectedDevices, setConnectedDevices] = useState([]);

  // useEffect(() => {
  //   const subscription = manager.onStateChange((state) => {
  //     if (state === "PoweredOn") {
  //       scanAndConnect();
  //       subscription.remove();
  //     }
  //   }, true);
  //   return () => subscription.remove();
  // }, [manager]);

  // useEffect(() => {
  //   // turn on bluetooth if it is not on
  //   BleManager.enableBluetooth().then(() => {
  //     console.log("Bluetooth is turned on!");
  //   });

  //   if (Platform.OS === "android" && Platform.Version >= 23) {
  //     PermissionsAndroid.check(
  //       PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  //     ).then((result) => {
  //       if (result) {
  //         console.log("Permission is OK");
  //       } else {
  //         PermissionsAndroid.request(
  //           PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  //         ).then((result) => {
  //           if (result) {
  //             console.log("User accept");
  //           } else {
  //             console.log("User refuse");
  //           }
  //         });
  //       }
  //     });
  //   }
  // }, []);

  // useEffect(() => {
  //   // start bluetooth manager
  //   BleManager.start({ showAlert: false }).then(() => {
  //     console.log("BleManager initialized");
  //   });
  // }, []);

  // useEffect(() => {
  //   let stopListener = BleManagerEmitter.addListener(
  //     "BleManagerStopScan",
  //     () => {
  //       setIsScanning(false);
  //       console.log("Scan is stopped");
  //     }
  //   );
  // }, []);

  // const startScan = () => {
  //   if (!isScanning) {
  //     BleManager.scan([], 5, true)
  //       .then((data) => {
  //         console.log("Scanning...", data);
  //         setIsScanning(true);
  //       })
  //       .catch((error) => {
  //         console.error(error);
  //       });
  //   }
  // };

  const {
    requestPermissions,
    scanForPeripherals,
    allDevices,
    connectToDevice,
    connectedDevice,
    disconnectFromDevice,
    writeToUnlockF2,
    writeToGetStatusF2,
    writeToQueryPrivateKeyF2,
    writeToSetPrivateKeyOneF2,
  } = useBLE();

  const scanForDevices = async () => {
    const isPermissionsEnabled = await requestPermissions();
    if (isPermissionsEnabled) {
      scanForPeripherals();
    }
  };

  console.log("Heree", allDevices);

  useEffect(() => {
    if (allDevices.length) {
      (async function myFunc() {
        // Beginning of function
        await connectToDevice(allDevices[0]);
      })();
    }
  }, [allDevices]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        {/* <ThemedText>
          Click Login to{" "}
          <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText>{" "}
          to see changes. Press{" "}
          <ThemedText type="defaultSemiBold">
            {Platform.select({ ios: "cmd + d", android: "cmd + m" })}
          </ThemedText>{" "}
          to open developer tools.
        </ThemedText> */}
      </ThemedView>
      {/* <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 2: Explore</ThemedText>
        <ThemedText>
          Tap the Explore tab to learn more about what's included in this
          starter app.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          When you're ready, run{" "}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText>{" "}
          to get a fresh <ThemedText type="defaultSemiBold">app</ThemedText>{" "}
          directory. This will move the current{" "}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{" "}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText> */}
      {/* </ThemedView> */}

      <View marginT-100 center>
        <Button
          onPress={() => scanForDevices()}
          text70
          background-green30
          label="Connect To Device"
        />

        <Button
          onPress={() => disconnectFromDevice()}
          text70
          white
          style={{ marginTop: 10 }}
          background-red30
          label="Disconnect from Device"
        />

        <Button
          onPress={() => writeToUnlockF2(connectedDevice)}
          text70
          white
          style={{ marginTop: 10 }}
          background-blue30
          label="Unlock Locks"
        />

        <Button
          onPress={() => writeToGetStatusF2(connectedDevice)}
          text70
          white
          style={{ marginTop: 10 }}
          background-grey30
          label="Get Module Status"
        />
        <Button
          onPress={() => writeToSetPrivateKeyOneF2(connectedDevice)}
          text70
          white
          style={{ marginTop: 10 }}
          background-orange30
          label="Set Private Key 1"
        />
        <Button
          onPress={() => writeToQueryPrivateKeyF2(connectedDevice)}
          text70
          white
          style={{ marginTop: 10 }}
          background-black30
          label="Get Query key 3"
        />
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
