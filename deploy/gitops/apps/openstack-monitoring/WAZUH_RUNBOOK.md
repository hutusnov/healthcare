# Wazuh Setup Runbook

## Manager (data-core-node Docker)
```bash
cd ~/wazuh-docker/single-node
docker compose up -d
```

## Agents (chạy trên từng node)
```bash
curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | \
  sudo gpg --no-default-keyring --keyring gnupg-ring:/usr/share/keyrings/wazuh.gpg --import
sudo chmod 644 /usr/share/keyrings/wazuh.gpg
echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" | \
  sudo tee /etc/apt/sources.list.d/wazuh.list
sudo apt-get update
wget https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_4.7.0-1_amd64.deb
sudo dpkg -i wazuh-agent_4.7.0-1_amd64.deb
sudo sed -i 's/MANAGER_IP/192.168.100.83/' /var/ossec/etc/ossec.conf
sudo systemctl enable wazuh-agent && sudo systemctl start wazuh-agent
```

## CloudTrail Integration
AWS credentials stored in /root/.aws/credentials inside wazuh.manager container.
Config in ~/wazuh-docker/single-node/config/wazuh_cluster/wazuh_manager.conf

## Cloudflare Tunnel
wazuh-healthcare.htsnov.com → https://192.168.100.83:443 (noTLSVerify: true)
in /etc/cloudflared/config.yml on k3s-master-vpn
