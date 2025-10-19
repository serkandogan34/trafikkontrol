#!/bin/bash
echo "=================================="
echo "Production Dashboard Access Info"
echo "=================================="
echo ""
echo "Production Server: 207.180.204.60"
echo "Dashboard Port: 3000"
echo ""
echo "To access the dashboard:"
echo "1. Direct URL: http://207.180.204.60:3000/dashboard"
echo "2. Login URL: http://207.180.204.60:3000/login"
echo ""
echo "Note: Make sure port 3000 is open in the firewall"
echo ""

# Check if port 3000 is accessible
echo "Checking port 3000 accessibility..."
sshpass -p 'Esvella2025136326.' ssh -o StrictHostKeyChecking=no root@207.180.204.60 "netstat -tlnp | grep :3000"
