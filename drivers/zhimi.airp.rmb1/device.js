const Homey = require("homey");
const miio = require("miio");


//https://home.miot-spec.com/spec?type=urn%3Amiot-spec-v2%3Adevice%3Aair-purifier%3A0000A007%3Azhimi-rmb1%3A1

const params = [
  { siid: 2, piid: 1 }, //on off
  { siid: 2, piid: 2 }, //fault
  { siid: 2, piid: 4 }, //mode
  { siid: 3, piid: 4 }, //pm2.5
  { siid: 3, piid: 7 }, //temperature
  { siid: 3, piid: 1 }, //% filter life level
  { siid: 6, piid: 1 }, //alarm
  { siid: 13, piid: 2 }, //screen brightness // 0,1,2
  { siid: 8, piid: 1 }, //kid lock
  { siid: 9, piid: 11 }, //fan level (0 - 2500)
];

class MiAirPurifier4Lite extends Homey.Device {
  async onInit() {
    if (process.env.DEBUG === '1') {
			require('inspector').open(9222, '0.0.0.0', true);
		}

    this.log('MyDevice has been initialized');

    this.initialize = this.initialize.bind(this);
    this.driver = this.homey.drivers.getDriver("zhimi.airp.rmb1");
    this.data = this.getData();
    this.initialize();
    this.log("Mi Homey device init | name: " + this.getName() + " - class: " + this.getClass() + " - data: " + JSON.stringify(this.data));
  }

  async initialize() {
    this.registerActions();
    this.registerCapabilities();
    this.getAirPurifierStatus();
  }

  registerActions() {
    const { actions } = this.driver;
    this.homey.flow.getActionCard("zhimi_airpurifier_mb4_mode");
  }

  registerCapabilities() {
    this.registerOnOffButton("onoff");
    this.registerFavoriteFanLevel("dim");
    this.registerAirPurifierMode("zhimi_airpurifier_mb4_mode");
  }

  getAirPurifierStatus() {
    miio
      .device({ address: this.getSetting("deviceIP"), token: this.getSetting("deviceToken") })
      .then((device) => {
        if (!this.getAvailable()) {
          this.setAvailable();
        }
        this.device = device;

        this.device
          .call("get_properties", params, { retries: 1 })
          .then((result) => {
            const powerResult = result.filter((r) => r.siid == 2 && r.piid == 1)[0];
            const deviceFaultResult = result.filter((r) => r.siid == 2 && r.piid == 2)[0];
            const deviceModeResult = result.filter((r) => r.siid == 2 && r.piid == 4)[0];
            const deviceFanLevelResult = result.filter((r) => r.siid == 9 && r.piid == 11)[0];
            const devicePM25Result = result.filter((r) => r.siid == 3 && r.piid == 4)[0];
            const deviceHumidityResult = result.filter((r) => r.siid == 3 && r.piid == 1)[0];
            const deviceTemperatureResult = result.filter((r) => r.siid == 3 && r.piid == 7)[0];
            const deviceBuzzerResult = result.filter((r) => r.siid == 6 && r.piid == 1)[0];
            const deviceLedBrightnessResult = result.filter((r) => r.siid == 13 && r.piid == 2)[0];
            const deviceChildLockResult = result.filter((r) => r.siid == 8 && r.piid == 1)[0];

            this.updateCapabilityValue("onoff", powerResult.value);
            this.updateCapabilityValue("measure_humidity", deviceHumidityResult.value);
            this.updateCapabilityValue("measure_temperature", deviceTemperatureResult.value);
            this.updateCapabilityValue("zhimi_airpurifier_mb4_mode", "" + deviceModeResult.value);
            this.updateCapabilityValue("dim", deviceFanLevelResult.value);
            this.updateCapabilityValue("measure_pm25", +devicePM25Result.value);

            this.setSettings({ led: !!deviceLedBrightnessResult.value });
            this.setSettings({ buzzer: deviceBuzzerResult.value });
            this.setSettings({ childLock: deviceChildLockResult.value });
          })
          .catch((error) => this.log("Sending commmand 'get_properties' error: ", error));

        const update = this.getSetting("updateTimer") || 60;
        this.updateTimer(update);
      })
      .catch((error) => {
        this.setUnavailable(error.message);
        clearInterval(this.updateInterval);
        setTimeout(() => {
          this.getAirPurifierStatus();
        }, 10000);
      });
  }

  updateTimer(interval) {
    clearInterval(this.updateInterval);
    this.updateInterval = setInterval(() => {
      this.device
        .call("get_properties", params, { retries: 1 })
        .then((result) => {
          if (!this.getAvailable()) {
            this.setAvailable();
          }
          const powerResult = result.filter((r) => r.siid == 2 && r.piid == 1)[0];
          const deviceFaultResult = result.filter((r) => r.siid == 2 && r.piid == 2)[0];
          const deviceModeResult = result.filter((r) => r.siid == 2 && r.piid == 4)[0];
          const deviceFanLevelResult = result.filter((r) => r.siid == 9 && r.piid == 11)[0];
          const devicePM25Result = result.filter((r) => r.siid == 3 && r.piid == 4)[0];
          const deviceHumidityResult = result.filter((r) => r.siid == 3 && r.piid == 1)[0];
          const deviceTemperatureResult = result.filter((r) => r.siid == 3 && r.piid == 7)[0];
          const deviceBuzzerResult = result.filter((r) => r.siid == 6 && r.piid == 1)[0];
          const deviceLedBrightnessResult = result.filter((r) => r.siid == 13 && r.piid == 2)[0];
          const deviceChildLockResult = result.filter((r) => r.siid == 8 && r.piid == 1)[0];

          this.updateCapabilityValue("onoff", powerResult.value);
          this.updateCapabilityValue("measure_humidity", deviceHumidityResult.value);
          this.updateCapabilityValue("measure_temperature", deviceTemperatureResult.value);
          this.updateCapabilityValue("zhimi_airpurifier_mb4_mode", "" + deviceModeResult.value);
          this.updateCapabilityValue("dim", deviceFanLevelResult.value);
          this.updateCapabilityValue("measure_pm25", +devicePM25Result.value);

          this.setSettings({ led: !!deviceLedBrightnessResult.value });
          this.setSettings({ buzzer: deviceBuzzerResult.value });
          this.setSettings({ childLock: deviceChildLockResult.value });
        })
        .catch((error) => {
          this.log("Sending commmand error: ", error);
          this.setUnavailable(error.message);
          clearInterval(this.updateInterval);
          setTimeout(() => {
            this.getAirPurifierStatus();
          }, 1000 * interval);
        });
    }, 1000 * interval);
  }

  updateCapabilityValue(capabilityName, value) {
    if (this.getCapabilityValue(capabilityName) != value) {
      this.setCapabilityValue(capabilityName, value)
        .then(() => {
          this.log("[" + this.data.id + "] [" + capabilityName + "] [" + value + "] Capability successfully updated");
        })
        .catch((error) => {
          this.log("[" + this.data.id + "] [" + capabilityName + "] [" + value + "] Capability not updated because there are errors: " + error.message);
        });
    }
  }

  onSettings(oldSettings, newSettings, changedKeys, callback) {
    if (changedKeys.includes("updateTimer") || changedKeys.includes("deviceIP") || changedKeys.includes("deviceToken")) {
      this.getAirPurifierStatus();
      callback(null, true);
    }

    if (changedKeys.includes("led")) {
      this.device
        .call("set_properties", [{ siid: 7, piid: 2, value: newSettings.led ? 8 : 0 }], { retries: 1 })
        .then(() => {
          this.log("Sending " + this.getName() + " commmand: " + newSettings.led);
          callback(null, true);
        })
        .catch((error) => {
          this.log("Sending commmand 'set_properties' error: ", error);
          callback(error, false);
        });
    }

    if (changedKeys.includes("buzzer")) {
      this.device
        .call("set_properties", [{ siid: 6, piid: 1, value: newSettings.buzzer }], { retries: 1 })
        .then(() => {
          this.log("Sending " + this.getName() + " commmand: " + newSettings.buzzer);
          callback(null, true);
        })
        .catch((error) => {
          this.log("Sending commmand 'set_properties' error: ", error);
          callback(error, false);
        });
    }

    if (changedKeys.includes("childLock")) {
      this.device
        .call("set_properties", [{ siid: 8, piid: 1, value: newSettings.childLock }], { retries: 1 })
        .then(() => {
          this.log("Sending " + this.getName() + " commmand: " + newSettings.childLock);
          callback(null, true);
        })
        .catch((error) => {
          this.log("Sending commmand 'set_properties' error: ", error);
          callback(error, false);
        });
    }
  }

  registerOnOffButton(name) {
    this.registerCapabilityListener(name, async (value) => {
      this.device
        .call("set_properties", [{ siid: 2, piid: 1, value }], { retries: 1 })
        .then(() => this.log("Sending " + name + " commmand: " + value))
        .catch((error) => this.log("Sending commmand 'set_properties' error: ", error));
    });
  }

  registerFavoriteFanLevel(name) {
    this.registerCapabilityListener(name, async (value) => {
      this.device
        .call("set_properties", [{ siid: 9, piid: 11, value: Math.ceil(value) }], { retries: 1 })
        .then(() => this.log("Sending " + name + " commmand: " + Math.ceil(value)))
        .catch((error) => this.log("Sending commmand 'set_properties' error: ", error));
    });
  }

  registerAirPurifierMode(name) {
    this.registerCapabilityListener(name, async (value) => {
      this.device
        .call("set_properties", [{ siid: 2, piid: 4, value: +value }], { retries: 1 })
        .then(() => this.log("Sending " + name + " commmand: " + value))
        .catch((error) => this.log("Sending commmand 'set_properties' error: ", error));
    });
  }

  registerAirPurifierModeAction(name, action) {
    action.registerRunListener(async (args, state) => {
      try {
        miio
          .device({
            address: args.device.getSetting("deviceIP"),
            token: args.device.getSetting("deviceToken"),
          })
          .then((device) => {
            device
              .call("set_properties", [{ siid: 2, piid: 4, value: +args.modes }], { retries: 1 })
              .then(() => {
                this.log("Set 'set_properties': ", args.modes);
                device.destroy();
              })
              .catch((error) => {
                this.log("Set 'set_properties' error: ", error.message);
                device.destroy();
              });
          })
          .catch((error) => {
            this.log("miio connect error: " + error);
          });
      } catch (error) {
        this.log("catch error: " + error);
      }
    });
  }

  onDeleted() {
    this.log("Device deleted");
    clearInterval(this.updateInterval);
    if (typeof this.device !== "undefined") {
      this.device.destroy();
    }
  }
}

module.exports = MiAirPurifier4Lite;
