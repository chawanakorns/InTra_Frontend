const { AndroidConfig, createRunOncePlugin, withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Helper to add the network security config attribute to the application tag
const withNetworkSecurityConfig = (config) => {
  return withAndroidManifest(config, (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplication(config.modResults);
    if (mainApplication && mainApplication.$) {
      mainApplication.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    }
    return config;
  });
};

// Helper to write the actual XML file
const withNetworkSecurityConfigFile = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const { platformProjectRoot } = config.modRequest;
      const xmlPath = path.join(platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
      await fs.promises.mkdir(xmlPath, { recursive: true });
      
      const ec2Ip = config.extra?.ec2Ip;
      if (!ec2Ip) {
        throw new Error("You must define `extra.ec2Ip` in your app.json to use this plugin.");
      }

      const networkSecurityConfig = `
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">${ec2Ip}</domain>
    </domain-config>
</network-security-config>
`;
      await fs.promises.writeFile(
        path.join(xmlPath, 'network_security_config.xml'),
        networkSecurityConfig.trim()
      );
      return config;
    },
  ]);
};

// Main plugin function that combines both modifications
const withAndroidCleartext = (config) => {
  config = withNetworkSecurityConfig(config);
  config = withNetworkSecurityConfigFile(config);
  return config;
};

module.exports = createRunOncePlugin(withAndroidCleartext, 'withAndroidCleartext', '1.0.0');