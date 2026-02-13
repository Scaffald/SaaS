// Mock for react-native/Libraries/Alert/RCTAlertManager
// Alert manager for web - uses browser alert/confirm
module.exports = {
  alertWithArgs: function(args, callback) {
    console.warn('RCTAlertManager.alertWithArgs called in web environment')
    if (args && args.message) {
      window.alert(args.message)
    }
    if (callback) {
      callback()
    }
  }
}
