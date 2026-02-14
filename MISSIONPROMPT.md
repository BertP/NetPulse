MISSIONPROMPT: Project NetPulse
1. Vision & Objectives
Development of NetPulse, a mobile-first monitoring dashboard for real-time visualization of network devices. The system consolidates data from various sources and provides proactive alerts for downtime, ensuring maximum transparency across the network infrastructure.

2. Functional Requirements
A. Redundant Discovery Engine
Controller Integration: Retrieve data from existing sources (e.g., UniFi API of the Cloud Gateway Ultra).

Network Probing: Active reachability checks within the local network (e.g., ICMP/ARP).

Data Synchronization: Merging both sources to ensure seamless tracking of both dynamic (DHCP) and static IP participants.

B. Dashboard & Reporting
Mobile-First UI: A responsive web interface featuring intuitive status visualization (traffic light system: Online / Unstable / Offline).

On-Demand Reporting: Functionality to generate a structured Markdown report documenting the current network state. The report should include the following information:

- Device name
- IP address with info if this is a fixed ip or an dhcp lease   
- MAC address
- Vendor
- Last seen time
- Status (Online / Unstable / Offline)
- add some usefull statistics at the end of the report (e.g. number of devices, number of online devices, number of unstable devices, number of offline devices, number of DHCP clients, Numder of devices per manufacturer, and so on

The report should be generated in Markdown format and should be saved to a file with the following naming convention: network_report_YYYY-MM-DD_HH-MM-SS.md

The report should be opened in a new browser tab after generation.

C. Alerting & Monitoring
Threshold Logic: Monitoring with configurable triggers (e.g., alert triggered after 10 minutes of continuous offline status).

Notification: Automated email dispatch upon critical status changes.

3. Infrastructure & Environment
Development Environment: Windows 11.

Deployment: The application must be delivered as a Docker Compose Stack.

Target Platform: Ubuntu Server.

Tech-Stack: Technology-agnostic (freedom of choice for tools/languages, provided they are containerizable).

4. Implementation Roadmap
Phase 1: Establish connection to the primary network data source (API).

Phase 2: Implement active local network scanning mechanisms.

Phase 3: Develop the core service for data processing and Markdown generation.

Phase 4: Design the mobile-first web interface.

Phase 5: Finalize the Docker Compose configuration and alerting logic.