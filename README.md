# Pico-Macro-Keyboard (Node.js + CircuitPython)

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Raspberry Pi Pico](https://img.shields.io/badge/Raspberry_Pi_Pico-C51A4A?style=for-the-badge&logo=raspberrypi&logoColor=white)
![CircuitPython](https://img.shields.io/badge/CircuitPython-000000?style=for-the-badge&logo=python&logoColor=white)
![API ESPN](https://img.shields.io/badge/API-ESPN-CC0000?style=for-the-badge)
![API OpenF1](https://img.shields.io/badge/API-OpenF1-FF1801?style=for-the-badge)
![License MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

An educational "Bridge" project that connects real-time sports data from the **ESPN** and **OpenF1** APIs to a **Raspberry Pi Pico** hardware interface. This project demonstrates how to process complex web data on a host machine (Node.js) and transmit simplified instructions to a microcontroller via Serial communication.

## Acknowledgments
- Special thanks to the **[OpenF1 Project](https://openf1.org/)** for providing the comprehensive F1 data used in this project. 
- Thanks to the CircuitPython community for the excellent hardware libraries.

## Features
- **Live Multi-Sport Tracking:** Supports NBA, UCL, UEL, NFL, NASCAR, IRL, and F1.
- **Dynamic F1 Integration:** Fetches podium results and session schedules using the OpenF1 API with background caching.
- **Hardware Interface:** Uses a 16x2 I2C LCD to display scores and a 4-button keypad for navigation.
- **Bi-Directional Serial:** Node.js sends display data to the Pico; the Pico sends commands (`CMD:NEXT`, `CMD:TOGGLE_SPORT`) back to Node.js.
- **ANSI Filtering:** Robust handling of CircuitPython 10.x terminal escape sequences to ensure clean data transfer.

## Hardware Requirements
- **Raspberry Pi Pico** (running CircuitPython 10.x) -> GPIO pins are required for proper connection.
- **I2C 16x2 LCD Display** (e.g., PCF8574 interface)
- **4x Push Buttons** (Connected to GP11, GP13, GP15, GP17)
- **Wiring Cables, LED Light, Resistor, Breadboard** (For connection and health indicator purpose)
- **Micro-USB Data Cable**

## Setup

### 1. Raspberry Pi Pico (CircuitPython)
1. Install [CircuitPython](https://circuitpython.org/downloads) on your Pico.
2. Copy the `code.py` script to your `CIRCUITPY` drive.
3. Ensure the `lcd`, and `adafruit_hid`, `adafruit_bus_device`, `adafruit_datetime.mpy` and `adafruit_display_emoji_text.mpy` library folders are in your `lib` folder.

[Pinout documentation](https://pip-assets.raspberrypi.com/categories/610-raspberry-pi-pico/documents/RP-008309-DS-1-Pico-R3-A4-Pinout.pdf?disposition=inline)

### 2. Node.js Environment
1. Clone the repository 
2. Navigate to the Server directory
    ```bash
    cd Server
    ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the Server:
   ```env
   ESPN_BASE_URL=https://site.api.espn.com/apis/site/v2/sports
   OPENF1_BASE_URL=https://api.openf1.org/v1
   PICO_PORT=COM3  # Use /dev/ttyACM0 on Linux/Mac
   ```

### 3. Run the Bridge
From the /Server directory

```bash
node index.js
```
*Note: Without the bridge running, the Pico will not display sports results, but the Copy/Paste buttons will still function as a standard USB HID device.*

## Project Logic

### Data Handling
- **ESPN Handler:** Dynamically calculates the "Days since New Year" to fetch historical racing data and current season scores for team sports.
- **OpenF1 Handler:** Implements a "Fire and Forget" initialization to pre-load F1 session data in the background without blocking the main event loop for saving overall loading time and optimize number of API calls to OpenF1 to avoid rate limits.
- **String Formatting:** Since 16x2 LCDs are space-constrained, the Node.js app performs intelligent string truncation and date formatting (e.g., stripping "NASCAR Cup Series" from race names).

### Serial Protocol
The project uses a simple pipe-delimited protocol:
- **Host to Pico:** `Row 1 Text|Row 2 Text\n`
- **Pico to Host:** `CMD:NEXT` (Cycle through games) or `CMD:TOGGLE_SPORT` (Change league)

**Note on Serial Noise:** CircuitPython 10+ sends terminal status codes (ANSI escape sequences) that can interfere with command parsing. This project includes a quick patch to ignore these sequences, ensuring stable communication.

## Controls
| Button | Logic | Action |
| :--- | :--- | :--- |
| **1** | Macro | Sends `Ctrl+C` to PC |
| **2** | Macro | Sends `Ctrl+V` to PC |
| **3** | `CMD:NEXT` | Cycles through the list of games/sessions |
| **4** | `CMD:TOGGLE_SPORT` | Switches to the next sport in `sportsOrder` |

## Educational Notes
- **Serial Buffering:** Learning how to parse `stdin` and `stdout` between different environments.
- **Microcontroller Constraints:** Managing memory and display real-estate by offloading logic to a more powerful backend.
- **Microcontroller Hardware Setup:** Connection GPIO pins and correct use of grounding.

## ⚖️ License
MIT - Feel free to use this for your own hobby projects!