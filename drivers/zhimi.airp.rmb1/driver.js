const Homey = require("homey");
const miio = require("miio");

class MiAirPurifier4Lite extends Homey.Driver {
  async onInit() {
    this.log('MyDriver has been initialized');
    const airPurifierMode = this.homey.flow.getActionCard("zhimi_airpurifier_mb4_mode");
  }

  async onPair(session) {
    let pairingDevice = {};
    pairingDevice.name = "Xiaomi Smart Air Purifier 4 Lite";
    pairingDevice.settings = {};
    pairingDevice.data = {};

    session.setHandler("connect", async (data) => {
      const params = [{ siid: 2, piid: 1 }];

      this.data = data;
      let device = await miio.device({address: data.ip, token: data.token});
      let device_info = await device.call("miIO.info", []);
      let device_prop = await device.call("get_properties", params, {retires: 1,});
      let result = [];

      if (device_info.model == this.data.model) {
        pairingDevice.data.id = device_info.mac;
        
        if (device_prop && device_prop[0].code === 0) 
          {
            let resultData = {
              state: device_prop[0],
            };
            pairingDevice.settings.deviceIP = this.data.ip;
            pairingDevice.settings.deviceToken = this.data.token;
            if (this.data.timer < 5) {
              pairingDevice.settings.updateTimer = 5;
            } else if (this.data.timer > 3600) {
              pairingDevice.settings.updateTimer = 3600;
            } else {
              pairingDevice.settings.updateTimer = parseInt(this.data.timer);
            }

            return resultData;
          }
      
          if (error == "Error: Could not connect to device, handshake timeout") {
            return "timeout";
          }
          if (error == "Error: Could not connect to device, token might be wrong") {
            return "wrongToken";
          } else {
            return error;
          } 

      } else {
        let result = {
          notDevice: "It is not Xiaomi Smart Air Purifier 4 Lite",
        };
        pairingDevice.data.id = null;
        return result;
      };
    });

    session.setHandler("done", async (data) => {
      return pairingDevice;
    });
  }
}

module.exports = MiAirPurifier4Lite;
