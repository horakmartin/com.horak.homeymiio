const Homey = require("homey");
const miio = require("miio");

class XiaoMiHumidifier2Lite extends Homey.Driver {
  async onInit() {
    //if (process.env.DEBUG === '1') {
			require('inspector').open(9223, '0.0.0.0', true);
		//}

    this.log('Driver derma.humidifier.jsq2w has been initialized');
    const fanLevel = this.homey.flow.getActionCard("deerma_humidifier_jsq5_fan_level");
  }

  async onPair(session) {
    let pairingDevice = {};
    pairingDevice.name = "Xiaomi Humidifier 2 Lite";
    pairingDevice.settings = {};
    pairingDevice.data = {};

    session.setHandler("connect", async (data) => {
      this.data = data;
      miio
        .device({ address: data.ip, token: data.token })
        .then((device) => { 
          device
            .call("miIO.info", [])
            .then((value) => {
              if (value.model == this.data.model) {
                pairingDevice.data.id = value.mac;
                const params = [{ siid: 2, piid: 1 }];
                device
                  .call("get_properties", params, {
                    retries: 1,
                  })
                  .then((result) => {
                    if (result && result[0].code === 0) {
                      let resultData = {
                        state: result[0],
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
                  })
                  //.catch((error) => {return error});
              } else {
                let result = {
                  notDevice: "It is not Xiaomi Humidifier 2 Lite",
                };
                pairingDevice.data.id = null;
                return result;
              }
            })
            //.catch((error) => {return error});
        })
        /*.catch((error) => {
          if (error == "Error: Could not connect to device, handshake timeout") {
            return "timeout";
          }
          if (error == "Error: Could not connect to device, token might be wrong") {
            return "wrongToken";
          } else {
            return "Error";
          }
        });*/
    });

    session.setHandler("done", async (data) => {
      return pairingDevice;
    });
  }
}

module.exports = XiaoMiHumidifier2Lite;
