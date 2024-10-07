import { useMemo, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import {
  BleError,
  BleManager,
  Characteristic,
  Device,
} from "react-native-ble-plx";
import { Buffer } from "buffer";

import * as ExpoDevice from "expo-device";

import base64 from "react-native-base64";

function combineLocksToHex(...locks: any[]) {
  let combinedValue = 0;

  // Combine each lock's binary value using bitwise OR
  for (const lock of locks) {
    combinedValue |= parseInt(lock, 2);
  }

  console.log("BINARY", combinedValue);
  // Convert the combined value to hexadecimal
  return combinedValue.toString(16).padStart(6, "0").toUpperCase();
}

function combineLocks(locks: any) {
  return locks
    .reduce((accumulator: any, lock: any) => accumulator | lock, 0)
    .toString(16);
}

function multiplyHexValues(
  hex1: number,
  hex2: number,
  hex3: number,
  hex4: number
) {
  // Step 1: Use the hex values directly, since they are already in decimal form
  const num1 = hex1; // No need to convert, 0x1 is already 1
  const num2 = hex2; // 0x2 is 2
  const num3 = hex3; // 0x3 is 3

  // Step 2: Multiply the decimal values
  let resultDecimal = num1 | num2 | num3;

  if (hex4) {
    resultDecimal = resultDecimal | hex4;
  }

  // Step 3: Convert the resulting decimal back to hex
  const resultHex = resultDecimal.toString(16).padStart(6, "0").toUpperCase(); // Convert to uppercase for consistency

  return resultHex;
}

function xorHexStringsLong(hex1: string, hex2: string) {
  // Split hex strings into arrays of two characters (1 byte each)
  const bytes1 = hex1.match(/.{1,2}/g) || [];
  const bytes2 = hex2.match(/.{1,2}/g) || [];

  // Perform XOR on each corresponding byte
  const xorBytes = bytes1.map((byte: any, index: number) => {
    const num1 = parseInt(byte, 16);
    const num2 = parseInt(bytes2[index], 16);
    return (num1 ^ num2).toString(16).padStart(2, "0");
  });

  // Join the XORed bytes back into a single hex string
  return xorBytes.join("");
}

function orHexStringsLong(
  hex1: string,
  hex2: string,
  hex3: string,
  hex4?: string
) {
  const bytes1 = hex1.split(" ").map((byte) => byte.trim());
  const bytes2 = hex2.split(" ").map((byte) => byte.trim());
  const bytes3 = hex3.split(" ").map((byte) => byte.trim());
  const bytes4 = hex4 ? hex4.split(" ").map((byte) => byte.trim()) : [];

  // Perform OR on each corresponding byte
  const orBytes = bytes1.map((byte: any, index: number) => {
    const num1 = parseInt(byte, 16);
    const num2 = parseInt(bytes2[index], 16) || 0;
    const num3 = parseInt(bytes3[index], 16) || 0;
    const num4 = parseInt(bytes4[index], 16) || 0; // Uncomment if using hex4
    return (num1 | num2 | num3 | num4).toString(16).padStart(2, "0");
  });

  // Join the XORed bytes back into a single hex string
  const hexResult = orBytes.join("");

  return hexResult.replace(/^0+/, "") || "0";
}

// // Perform XOR on each corresponding byte
// const orBytes = bytes1.map((byte: any, index: number) => {
//   const num1 = parseInt(byte, 16);
//   const num2 = parseInt(bytes2[index], 16) || 0;
//   const num3 = parseInt(bytes3[index], 16) || 0;
//   const num4 = parseInt(bytes4[index], 16);
//   return (num1 | num2 | num3).toString(16).padStart(2, "0");
// });

// Split hex strings into arrays of two characters (1 byte each)
// const bytes1 = hex1.match(/.{1,2}/g) || [];
// const bytes2 = hex2.match(/.{1,2}/g) || [];
// const bytes3 = hex3.match(/.{1,2}/g) || [];
// const bytes4 = hex4.match(/.{1,2}/g) || [];

// const hexValue = "2E91";
// const decimalValue = parseInt(hexValue, 16); // This will yield 12921

// for battery
const hexToDecimalConversion = (hexValue: string) => {
  return parseInt(hexValue, 16);
};

const binaryToDecimalConversion = (hexValue: string) => {
  return parseInt(hexValue, 2);
};

const binaryToHexConversion = (binaryString: string) => {
  // Parse the binary string into a decimal number
  const decimalValue = parseInt(binaryString, 2);

  // Convert the decimal number to a hexadecimal string and pad it if needed
  return decimalValue.toString(16).padStart(6, "0").toUpperCase();
};

const decimalToBinaryConversion = (decimalNumber: number) => {
  return decimalNumber.toString(2).padStart(32, "0"); // Convert to binary and pad to 32 bits
};

const decimalToHexConversion = (decimalNumber: number) => {
  return decimalNumber.toString(16).padStart(8, "0").toUpperCase(); // Convert to hex and pad to 8 characters
};

// end

const hexToBinary = (hexString: string) => {
  // Parse the binary string into a decimal number
  const decimalValue = parseInt(hexString, 16);

  // Convert the decimal number to a binary by padding with 0 with pad start
  return decimalValue.toString(2).padStart(24, "0").toUpperCase();
};

const generateBinaryLockStatusOld = (locks: number[], totalLocks = 24) => {
  // Create an array of '0's with a length of totalLocks
  const lockStatus = Array(totalLocks).fill("0");

  // For each lock number in the locks array, set the corresponding bit to '1'
  locks.forEach((lock) => {
    // The lock index is (lock number - 1) since arrays are 0-indexed
    const index = lock - 1; // Directly using lock - 1
    if (index >= 0 && index < totalLocks) {
      lockStatus[index] = "1"; // Set the bit to '1'
    }
  });

  // Join the array into a binary string
  const binaryString = lockStatus.join("");

  console.log("BINARY STRING", binaryString);
  return binaryString;
};

const generateLockStatusFromBinaryOld = (
  binaryString: string,
  totalLocks = 24
) => {
  const activeLocks = [];

  for (let i = 0; i < totalLocks; i++) {
    if (binaryString[i] === "1") {
      // Lock numbers start from 1, so we add (i + 1)
      activeLocks.push(i + 1);
    }
  }

  return activeLocks;
};

const generateBinaryLockStatus = (locks: number[], totalLocks = 24) => {
  // Create an array of '0's with a length of totalLocks
  const lockStatus = Array(totalLocks).fill("0");

  // For each lock number in the locks array, set the corresponding bit to '1'
  locks.forEach((lock) => {
    // The lock index is (lock number - 1) since arrays are 0-indexed
    const index = lock - 1; // Directly using lock - 1
    if (index >= 0 && index < totalLocks) {
      lockStatus[index] = "1"; // Set the bit to '1'
    }
  });

  // Reverse the array every 8 bits (because of little-endian byte order)
  for (let i = 0; i < totalLocks; i += 8) {
    lockStatus.splice(i, 8, ...lockStatus.slice(i, i + 8).reverse());
  }

  // Join the array into a binary string
  const binaryString = lockStatus.join("");

  // Split into 8-bit chunks and convert each chunk to hexadecimal
  const hexString = (binaryString.match(/.{1,8}/g) || [])
    .map((byte) => {
      return parseInt(byte, 2).toString(16).padStart(2, "0").toUpperCase();
    })
    .join("");

  return {
    binaryString, // Binary string for reference
    hexString, // Final hex string representing the lock status
  };
};

const generateLockStatusFromHex = (hexString: string, totalLocks = 24) => {
  // Convert each hex pair to binary, padded to 8 bits (1 byte)
  const binaryString = (hexString.match(/.{1,2}/g) || [])
    .map((hex) => parseInt(hex, 16).toString(2).padStart(8, "0"))
    .join("");

  // Split the binary string into 8-bit chunks (bytes)
  const lockStatus = binaryString.match(/.{1,8}/g) || [];

  // Reverse each byte to account for little-endian order
  const reversedLockStatus = lockStatus.map((byte) =>
    byte.split("").reverse().join("")
  );

  // Flatten back into a single binary string
  const finalBinaryString = reversedLockStatus.join("");

  // Create an array to hold the locks that are "open" (i.e., those with a '1')
  const locks: number[] = [];

  // Iterate over the binary string and map '1's to lock numbers
  finalBinaryString.split("").forEach((bit, index) => {
    if (bit === "1") {
      locks.push(index + 1); // Lock numbers are 1-indexed
    }
  });

  return locks;
};

// Example usage:
console.log(
  "TESTTT METHOD",
  generateBinaryLockStatus([6, 7, 8]),
  generateLockStatusFromHex("070000")
);
// Output should match binary for locks 1, 8, 20, 21

// this method converts HEX values into pairs of hex values
const convertHexToPairs = (hexString: string) => {
  // Initialize an empty array to store the pairs
  const pairs = [];

  // Iterate through the hex string, taking two characters at a time
  for (let i = 0; i < hexString.length; i += 2) {
    // Extract the current pair
    const pair = hexString.slice(i, i + 2);
    // Push the pair into the array
    pairs.push(pair);
  }

  return pairs; // Return the array of pairs
};

const generateEncryptionKey = (
  key1: string[],
  key2: string[],
  key3: string[]
) => {
  console.log(key1, key2, key3);

  const producedKey = [];

  // Interweave Key 1 and Key 3 values in the required order
  producedKey.push(key1[0], key3[0]); // K11, K31
  producedKey.push(key1[1], key3[1]); // K12, K32
  producedKey.push(key2); // K21
  producedKey.push(key1[2], key1[3]); // K13, K14
  producedKey.push(key3[3]); // K34
  producedKey.push(key1[4], key3[4]); // K15, K35
  producedKey.push(key1[5], key3[5]); // K16, K36
  producedKey.push(key1[6], key3[6]); // K17, K37
  producedKey.push(key1[7]); // K18

  // Join the array into a single hex string (no commas)
  return producedKey.join("");
};

function calculateChecksum(hexValues: string[]) {
  // Convert hex values to their decimal equivalents and sum them
  const total = hexValues.reduce((sum, hex) => {
    return sum + parseInt(hex, 16);
  }, 0);

  // Calculate the checksum as the total modulo 256
  const checksum = total % 256;
  // const checksum = total & 0xff;

  // Convert the checksum back to a hex string, padding with 0 if necessary
  return checksum.toString(16).padStart(2, "0").toUpperCase();
}

// where hex1 is the encryption key, and hex2 is the command or encrypted command
function encryptCommandKey(generatedSecretKey: string, commandKey: string) {
  // Ensure both hex strings are the same length by padding the shorter one with zeros at the end
  // const maxLength = Math.max(hex1.length, hex2.length);

  // const paddedHex1 = generatedSecretKey.padEnd(minLength, "0");
  // const paddedHex2 = commandKey.padEnd(maxLength, "0");
  // console.log("maxlenght", maxLength, paddedHex1, paddedHex2);

  // for (let i = 0; i < maxLength; i += 2) {
  //   const byte1 = parseInt(paddedHex1.slice(i, i + 2), 16); // Get 2 characters, convert to integer (hex)
  //   const byte2 = parseInt(paddedHex2.slice(i, i + 2), 16); // Get 2 characters, convert to integer (hex)

  //   // XOR the bytes and convert the result back to hex (2 characters, zero-padded)
  //   const xorByte = (byte1 ^ byte2).toString(16).padStart(2, "0");

  //   xorResult += xorByte;
  // }

  const minLength = Math.min(generatedSecretKey.length, commandKey.length);

  // const truncatedHex1 = generatedSecretKey.slice(0, minLength);
  // const truncatedHex2 = commandKey.slice(0, minLength);

  let xorResult = "";

  // XOR each byte (two characters = 1 byte) of the padded hex strings
  for (let i = 0; i < minLength; i += 2) {
    const byte1 = parseInt(generatedSecretKey.slice(i, i + 2), 16); // Get 2 characters, convert to integer (hex)
    const byte2 = parseInt(commandKey.slice(i, i + 2), 16); // Get 2 characters, convert to integer (hex)

    // XOR the bytes and convert the result back to hex (2 characters, zero-padded)
    const xorByte = (byte1 ^ byte2).toString(16).padStart(2, "0");

    xorResult += xorByte;
    console.log(
      // xorResult,
      // xorByte,
      // i,
      minLength,
      commandKey.length,
      generatedSecretKey.length
    );
  }

  return xorResult;
}

// Example usage:
const hex1 = "A1C1A2C2B1A3C3A4C4A5C5A6C6A7C7A8"; // Key from the previous function
const hex2 = "F5710005A75F0A0000810018"; // Example hex value to XOR with

const encryptedHex = encryptCommandKey(hex1, hex2);
console.log("ENCYRPTED VALUE", encryptedHex);
console.log(
  "GENERATED COMMAN",
  encryptCommandKey(hex1, "54b0a2c716fcc9a4c424c5be")
);

export function byteToString(arr: any) {
  if (typeof arr === "string") {
    return arr;
  }
  var str = "",
    _arr = arr;
  for (var i = 0; i < _arr.length; i++) {
    var one = _arr[i].toString(2),
      v = one.match(/^1+?(?=0)/);
    if (v && one.length == 8) {
      var bytesLength = v[0].length;
      var store = _arr[i].toString(2).slice(7 - bytesLength);
      for (var st = 1; st < bytesLength; st++) {
        store += _arr[st + i].toString(2).slice(2);
      }
      str += String.fromCharCode(parseInt(store, 2));
      i += bytesLength - 1;
    } else {
      str += String.fromCharCode(_arr[i]);
    }
  }
  return str;
}

function hexToBytes(hex: string) {
  let bytes = [];
  for (let c = 0; c < hex.length; c += 2) {
    bytes.push(parseInt(hex.substr(c, 2), 16));
  }
  return bytes;
}

function bytesToHex(bytes: string) {
  return Array.from(bytes)
    .map((byte) => byte.charCodeAt(0).toString(16).padStart(2, "0"))
    .join(" ");
}

// 87 e1 80 4a 6f 0d ae

interface BluetoothLowEnergyApi {
  requestPermissions(): Promise<boolean>;
  scanForPeripherals(): void;
  connectToDevice: (deviceId: Device) => Promise<void>;
  disconnectFromDevice: () => void;
  connectedDevice: Device | null;
  allDevices: Device[];
  writeToUnlockF2: (device: Device | null) => void;
  writeToGetStatusF2: (device: Device | null) => void;
  writeToQueryPrivateKeyF2: (device: Device | null) => void;
  writeToSetPrivateKeyOneF2: (device: Device | null) => void;
}

function useBLE(): BluetoothLowEnergyApi {
  const bleManager = useMemo(() => new BleManager(), []);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [characteristics, setCharacteristics] = useState<object[]>([]);
  const [monitoringVal1, setMonitoringVal1] = useState<string>("");

  const requestAndroid31Permissions = async () => {
    const bluetoothScanPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    const bluetoothConnectPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    const fineLocationPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );

    return (
      bluetoothScanPermission === "granted" &&
      bluetoothConnectPermission === "granted" &&
      fineLocationPermission === "granted"
    );
  };

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "Bluetooth Low Energy requires Location",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const isAndroid31PermissionsGranted =
          await requestAndroid31Permissions();

        return isAndroid31PermissionsGranted;
      }
    } else {
      return true;
    }
  };

  const isDuplicteDevice = (devices: Device[], nextDevice: Device) =>
    devices.findIndex((device) => nextDevice.id === device.id) > -1;

  const scanForPeripherals = () =>
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log(error);
      }
      if (device && device.name?.includes("BTCU")) {
        setAllDevices((prevState: Device[]) => {
          if (!isDuplicteDevice(prevState, device)) {
            return [...prevState, device];
          }
          return prevState;
        });
      }
    });

  const connectToDevice = async (device: Device) => {
    console.log("hello");
    try {
      const deviceConnection = await bleManager.connectToDevice(device.id);
      setConnectedDevice(deviceConnection);
      await deviceConnection.discoverAllServicesAndCharacteristics();
      const services = await device.services();
      services.map(async (service) => {
        console.log(JSON.stringify(service.uuid), service.id, "heree");

        if (service.uuid) {
          console.log(JSON.stringify(service.uuid), service.isPrimary, "heree");
          const chars = await service.characteristics();

          chars.map(async (char) => {
            const c = {
              uuid: char.uuid,
              serviceUuid: service.uuid,
              isReadable: char.isReadable,
              isWritableWithResponse: char.isWritableWithResponse,
              isWritableWithoutResponse: char.isWritableWithoutResponse,
              isNotifiable: char.isNotifiable,
              isNotifying: char.isNotifying,
              value: char.value,
            };

            if (c.isNotifiable) {
              if (c.uuid === "0000fff3-0000-1000-8000-00805f9b34fb") {
                startStreamingData(
                  deviceConnection,
                  service.uuid,
                  c.uuid,
                  onDataChangeForF3
                );
              } else if (c.uuid === "0000fff1-0000-1000-8000-00805f9b34fb") {
                startStreamingData(
                  deviceConnection,
                  service.uuid,
                  c.uuid,
                  onDataChangeForF1
                );
              }
            }

            console.log("UUID Char", service.uuid, c);
            setCharacteristics([...characteristics, c]);

            // if ()

            // if (char.uuid === "0000fff3-0000-1000-8000-00805f9b34fb") {
            //   console.log("THIS CALLED");
            //   // await bleManager.monitorCharacteristicForDevice(
            //   //   device.id,
            //   //   service.uuid,
            //   //   char.uuid,
            //   //   onDataChangeFor1
            //   // );
            // }

            // try {
            //   const charData = await bleManager.readCharacteristicForDevice(
            //     device.id,
            //     service.uuid,
            //     char.uuid
            //   );

            //   // const buffer = Buffer.from(charData?.value || "", "base64");
            //   // // let value = buffer.toString("utf-8");
            //   // const value = byteToString(buffer);

            //   const buffer = charData?.value || "";
            //   const value = base64.decode(buffer);

            //   // const descriptors = await charData.descriptors();
            //   // console.log(
            //   //   "read success for char",
            //   //   service.uuid,
            //   //   char.uuid,
            //   //   buffer,
            //   //   value
            //   //   // JSON.stringify(descriptors)
            //   // );

            //   // if (char.isNotifiable) {
            //   //   startStreamingData(deviceConnection, service.uuid, char.uuid);
            //   // }

            //   // descriptors.map(async (desc) => {
            //   //   console.log("UUID desc", service.uuid, c.uuid, desc.uuid);

            //   //   // if (char.isWritableWithResponse) {
            //   //   //   await desc.write(base64.encode("\x01\x00"));
            //   //   // }

            //   //   const value = desc.value;
            //   //   const readData = await desc.read();
            //   //   const readValue = base64.decode(readData?.value || "");

            //   //   // console.log(
            //   //   //   "read success for descriptor",
            //   //   //   service.uuid,
            //   //   //   char.uuid,
            //   //   //   value,
            //   //   //   readValue,
            //   //   //   "haaaaa"
            //   //   //   // desc
            //   //   // );
            //   // });
            // } catch (err) {
            //   console.log(err);
            // }
          });
        }
      });

      // setTimeout(async () => {
      //   await deviceConnection.discoverAllServicesAndCharacteristics();

      //   console.log(JSON.stringify(deviceConnection), "heree");
      // }, 1000);

      bleManager.stopDeviceScan();
    } catch (e) {
      console.log("FAILED TO CONNECT", e);
    }
  };

  const disconnectFromDevice = () => {
    if (connectedDevice) {
      bleManager.cancelDeviceConnection(connectedDevice.id);
      setConnectedDevice(null);
    }
  };

  const onDataChangeForF3 = (
    error: BleError | null,
    characteristic: Characteristic | null
  ) => {
    console.log("VALLUEE CALLED for F3", characteristic);
    if (error) {
      console.log("VALLUEE error", error);
      return -1;
    } else if (!characteristic?.value) {
      console.log("VALLUEE no daata", characteristic);
      console.log("No Data was recieved");

      return -1;
    }
    const rawData = base64.decode(characteristic.value);
    // let innerHeartRate: number = -1;

    // const firstBitValue: number = Number(rawData) & 0x01;

    // if (firstBitValue === 0) {
    //   innerHeartRate = rawData[1].charCodeAt(0);
    // } else {
    //   innerHeartRate =
    //     Number(rawData[1].charCodeAt(0) << 8) +
    //     Number(rawData[2].charCodeAt(2));
    // }
    console.log("VALLUE", rawData);

    // setMonitoringVal1(innerHeartRate);
  };

  const onDataChangeForF1 = (
    error: BleError | null,
    characteristic: Characteristic | null
  ) => {
    // console.log("VALLUEE CALLED for F1", characteristic);
    if (error) {
      console.log("VALLUEE error", error);
      return -1;
    } else if (!characteristic?.value) {
      console.log("VALLUEE no daata", characteristic);
      console.log("No Data was recieved");

      return -1;
    }
    const decodedBytes = base64.decode(characteristic.value);
    const hexValue = bytesToHex(decodedBytes);
    console.log("Hex Value:", hexValue);

    if (hexValue.replace(/\s+/g, "").slice(2, 4) === "6e") {
      const queryKey3 = convertHexToPairs(
        hexValue.replace(/\s+/g, "").slice(14)
      );

      const encryptedKey = generateEncryptionKey(
        convertHexToPairs("1122334455667788"),
        convertHexToPairs("02"),
        queryKey3
      );
      setMonitoringVal1(encryptedKey);

      console.log(
        "FINAL QUERY 3",
        queryKey3,
        "FINAL ENCRYPTED KEY",
        encryptedKey
      );
    } else if (hexValue.replace(/\s+/g, "").slice(2, 4) === "73") {
      const statusHexCode = hexValue.replace(/\s+/g, "").slice(14);

      const lockStatus = statusHexCode.slice(0, 6);

      const getLockedLocks = generateLockStatusFromHex(lockStatus);

      const batteryVoltageHex = statusHexCode.slice(6, 10);
      const batteryVoltage = hexToDecimalConversion(batteryVoltageHex);

      // not sure what this for -  ask
      const idNumberOfLock = statusHexCode.slice(10);

      console.log(
        "FINAL STATUS",
        getLockedLocks,
        batteryVoltage,
        idNumberOfLock
      );
    }
  };

  const startStreamingData = async (
    device: Device,
    serviceId: string,
    charId: string,
    streamingFunc: (
      error: BleError | null,
      characteristic: Characteristic | null
    ) => -1 | undefined
  ) => {
    if (device) {
      device.monitorCharacteristicForService(
        serviceId,
        charId,
        streamingFunc
        // onDataChangeFor1
      );
    } else {
      console.log("No Device Connected");
    }
  };
  const writeToUnlockF2 = async (
    device: Device | null,
    serviceId = "0000fff0-0000-1000-8000-00805f9b34fb",
    charId = "0000fff2-0000-1000-8000-00805f9b34fb"
  ) => {
    if (device) {
      const lockSequence = "00";
      const powerSupply = "00";
      // const binaryResult = generateBinaryLockStatus([2, 8, 20, 21]);
      // const hexResult = binaryToHex(binaryResult);

      const hexResult = generateBinaryLockStatus([1, 2, 3, 4]).hexString;

      // const result = combineLocksToHex(
      //   LOCKS.LOCK_1,
      //   LOCKS.LOCK_8,
      //   LOCKS.LOCK_20,
      //   LOCKS.LOCK_21
      // );
      // const result = orHexStringsLong(
      //   Locks.LOCK_1,
      //   Locks.LOCK_15,
      //   Locks.LOCK_20,
      //   Locks.LOCK_22
      // );
      const checksum = calculateChecksum([
        "F5",
        "74",
        "00",
        "05",
        "02",
        "5F",
        lockSequence,
        powerSupply,
        hexResult.slice(0, 2), // First two characters
        hexResult.slice(2, 4), // Next two characters
        hexResult.slice(4, 6), // Next two characters
        // result.slice(6, 8) || "",
      ]);
      // const result = multiplyHexValues(
      //   locks.LOCK_1,
      //   locks.LOCK_2,
      //   locks.LOCK_3
      // );
      // const command = `F5740005025F690001${result ? result : "810018"}`;
      console.log("DEETS", checksum, hexResult);
      const command = `F5740005025F${checksum}${lockSequence}${powerSupply}${hexResult ? hexResult : "810018"}`;

      // const command = `F5711005025F${checksum}${lockSequence}${powerSupply}${hexResult ? hexResult : "810018"}`;

      // const command = "F5740005025F690001810018";
      // const encryptedCommand = xorHexStrings(monitoringVal1, command);
      // const byteArray = hexToBytes(encryptedCommand);

      const byteArray = hexToBytes(command);
      const value = base64.encode(String.fromCharCode(...byteArray));

      console.log(
        "RES",
        hexResult,
        command,
        // encryptedCommand,
        byteArray,
        value,
        base64.encode(value)
        // base64.encode(encryptedCommand)
      );

      device.writeCharacteristicWithResponseForService(
        serviceId,
        charId,
        value
      );
    } else {
      console.log("No Device Connected");
    }
  };

  const writeToGetStatusF2 = async (
    device: Device | null,
    serviceId = "0000fff0-0000-1000-8000-00805f9b34fb",
    charId = "0000fff2-0000-1000-8000-00805f9b34fb"
  ) => {
    if (device) {
      const command = "F5730000025FC9";
      const byteArray = hexToBytes(command);
      const value = base64.encode(String.fromCharCode(...byteArray));

      device.writeCharacteristicWithResponseForService(
        serviceId,
        charId,
        value
      );
    } else {
      console.log("No Device Connected");
    }
  };

  const writeToQueryPrivateKeyF2 = async (
    device: Device | null,
    serviceId = "0000fff0-0000-1000-8000-00805f9b34fb",
    charId = "0000fff2-0000-1000-8000-00805f9b34fb"
  ) => {
    if (device) {
      const command = "F56E0000025FC4";
      const byteArray = hexToBytes(command);
      const value = base64.encode(String.fromCharCode(...byteArray));

      // const result = orHexStringsLong(
      //   Locks.LOCK_1,
      //   Locks.LOCK_8,
      //   Locks.LOCK_20,
      //   Locks.LOCK_21
      // );

      // const result = combineLocksToHex(
      //   LOCKS.LOCK_1,
      //   LOCKS.LOCK_8,
      //   LOCKS.LOCK_20,
      //   LOCKS.LOCK_21
      // );

      // const result = multiplyHexValues(
      //   locks.LOCK_1,
      //   locks.LOCK_8,
      //   locks.LOCK_20,
      //   locks.LOCK_21
      // );

      // console.log("RESULT", result);

      device.writeCharacteristicWithResponseForService(
        serviceId,
        charId,
        value
      );
    } else {
      console.log("No Device Connected");
    }
  };

  const writeToSetPrivateKeyOneF2 = async (
    device: Device | null,
    serviceId = "0000fff0-0000-1000-8000-00805f9b34fb",
    charId = "0000fff2-0000-1000-8000-00805f9b34fb"
  ) => {
    if (device) {
      const hexResult = "1122334455667788";
      const checksum = calculateChecksum([
        "F5",
        "6F",
        "00",
        "08",
        "02",
        "5F",
        hexResult.slice(0, 2), // First two characters
        hexResult.slice(2, 4), // Next two characters
        hexResult.slice(4, 6),
        hexResult.slice(6, 8),
      ]);
      // const command = "F56F0008025F311122334455667788";
      const command = `F56F0008025F${checksum}${hexResult}`;

      const byteArray = hexToBytes(command);
      const value = base64.encode(String.fromCharCode(...byteArray));

      console.log("SET PRIVATE KEY 1", command, base64.encode(command), value);

      device.writeCharacteristicWithResponseForService(
        serviceId,
        charId,
        value
      );
    } else {
      console.log("No Device Connected");
    }
  };

  const writeToSetModuleIdNumber = async (
    device: Device | null,
    serviceId = "0000fff0-0000-1000-8000-00805f9b34fb",
    charId = "0000fff2-0000-1000-8000-00805f9b34fb"
  ) => {
    if (device) {
      const moduleNumber = 3;
      const hexResult = decimalToHexConversion(moduleNumber);
      const checksum = calculateChecksum([
        "F5",
        "72",
        "00",
        "04",
        "02",
        "5F",
        hexResult.slice(0, 2), // First two characters
        hexResult.slice(2, 4), // Next two characters
        hexResult.slice(4, 6),
        hexResult.slice(6, 8),
      ]);
      // const command = "F56F0008025F311122334455667788";
      const command = `F5720004025F${checksum}${hexResult}`;

      const byteArray = hexToBytes(command);
      const value = base64.encode(String.fromCharCode(...byteArray));

      console.log(
        "SET PRIVATE MODULE ID",
        command,
        base64.encode(command),
        value
      );

      device.writeCharacteristicWithResponseForService(
        serviceId,
        charId,
        value
      );
    } else {
      console.log("No Device Connected");
    }
  };

  return {
    scanForPeripherals,
    requestPermissions,
    connectToDevice,
    allDevices,
    connectedDevice,
    disconnectFromDevice,
    writeToUnlockF2,
    writeToGetStatusF2,
    writeToQueryPrivateKeyF2,
    writeToSetPrivateKeyOneF2,
  };
}

export default useBLE;
