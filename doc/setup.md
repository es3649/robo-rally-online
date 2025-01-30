# Robo-Rally Online Setup

Setting up this project is super non-trivial

## Software

### Bluetooth

This project depends on the BlueZ package, which is the official Bluetooth driver for Linux development stacks.
It requires root privileges by default, so you will either need to run as root (rarely recommended), or else grant your user access to BlueZ by adding the following to `/etc/dbus-1/system.d/node-ble.conf`

```xml
<!DOCTYPE busconfig PUBLIC "-//freedesktop//DTD D-BUS Bus Configuration 1.0//EN"
  "http://www.freedesktop.org/standards/dbus/1.0/busconfig.dtd">
<busconfig>
  <policy user="__USERID__">
   <allow own="org.bluez"/>
    <allow send_destination="org.bluez"/>
    <allow send_interface="org.bluez.GattCharacteristic1"/>
    <allow send_interface="org.bluez.GattDescriptor1"/>
    <allow send_interface="org.freedesktop.DBus.ObjectManager"/>
    <allow send_interface="org.freedesktop.DBus.Properties"/>
  </policy>
</busconfig>
```

where `__USERID__` is replaces with the ID of the user which will be running the electron app.

### NodeJS

## Hardware

This is where things go crazy

### Motherboard Manufacture

### Bill of Materials

The following are required for assembly

* 1x Raspberry Pi 5 (or another Bluetooth-enabled Linux device)
* 6x Arduino Nano 33 BLE
* 6x Manufactured Motherboards
* 6x MicroSD cards (min 128MB)

TODO: Bill of materials for the chip

The following tools will also be needed for assembly, but will not be incorporated into the final product.

* 1x Micro-USB wire. The other end must attach to your development device (USB or USB-C)
* SMD Rework station, incl solder

### Arduino Programming

### Assembly

## Other Components

### Board
