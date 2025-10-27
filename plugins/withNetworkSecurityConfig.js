const { withAndroidColors, withStringsXml, withAndroidStyles } = require('@expo/config-plugins');
const {
  createRunOncePlugin,
  withDangerousMod,
  AndroidConfig,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withNetworkSecurityConfig = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const { modRequest, modResults } = config;
      const { platformProjectRoot } = modRequest;

      // 1. Define the path for the new XML file
      const resPath = path.join(platformProjectRoot, 'app', 'src', 'main', 'res');
      const xmlPath = path.join(resPath, 'xml');
      const networkSecurityConfigFile = path.join(xmlPath, 'network_security_config.xml');

      // 2. Get your EC2 IP from app.json (we'll add this next)
      const ec2Ip = config.extra.ec2Ip;
      if (!ec2Ip) {
        throw new Error("EC2 IP address is not defined in app.json's extra field. Please add `extra: { ec2Ip: 'your.ip.address' }`.");
      }

      // 3. Create the XML content
      const xmlContent = `
        <?xml version="1.0" encoding="utf-8"?>
        <network-security-config>
            <domain-config cleartextTrafficPermitted="true">
                <domain includeSubdomains="true">${ec2Ip}</domain>
                <domain includeSubdomains="true">localhost</domain>
            </domain-config>
        </network-security-config>
        `;

      // 4. Create the xml folder and write the file
      await fs.promises.mkdir(xmlPath, { recursive: true });
      await fs.promises.writeFile(networkSecurityConfigFile, xmlContent);

      // 5. Modify AndroidManifest.xml to use the new file
      const mainApplication = AndroidConfig.Manifest.getMainApplication(modResults.manifest);
      if (mainApplication && mainApplication.$) {
        mainApplication.$['android:networkSecurityConfig'] = '@xml/network_security_config';
      }

      return config;
    },
  ]);
};

module.exports = createRunOncePlugin(
  withNetworkSecurityConfig,
  'withNetworkSecurityConfig',
  '1.0.0'
);