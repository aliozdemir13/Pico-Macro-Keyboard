import board
import digitalio
import keypad
import time
import usb_hid
import sys
import select
from adafruit_hid.keyboard import Keyboard
from adafruit_hid.keycode import Keycode
import busio
from lcd.lcd import LCD
from lcd.i2c_pcf8574_interface import I2CPCF8574Interface

# --- Setup ---
# GP15 -> yellow -> Ctrl + C
# GP11 -> blue -> CMD:NEXT
# GP13 -> red -> CMD:TOGGLE_SPORT
# GP17 -> white -> Ctrl + V
kbd = Keyboard(usb_hid.devices)
pins = (board.GP15, board.GP17, board.GP11, board.GP13)
keys = keypad.Keys(pins, value_when_pressed=False, pull=True)
# --- LEDs ---
led = digitalio.DigitalInOut(board.LED)
led.direction = digitalio.Direction.OUTPUT
ledExt = digitalio.DigitalInOut(board.GP16)
ledExt.direction = digitalio.Direction.OUTPUT
led.value = True
ledExt.value = True

# Only Buttons 1 & 2 remain as Macros
shortcuts = {
    0: (Keycode.CONTROL, Keycode.C),
    1: (Keycode.CONTROL, Keycode.V),
#    2: (Keycode.CONTROL, Keycode.ALT, Keycode.ONE), # In use for toggle sports
#    3: (Keycode.CONTROL, Keycode.ALT, Keycode.TWO) # In use for toggle index in sports
}

i2c = busio.I2C(board.GP1, board.GP0)
lcd = LCD(I2CPCF8574Interface(i2c, 0x27), num_rows=2, num_cols=16)

def get_serial_input():
    if select.select([sys.stdin], [], [], 0)[0]:
        return sys.stdin.readline().strip()
    return None

lcd.clear()
lcd.print("NBA/F1 Tracker")

while True:
    serial_data = get_serial_input()
    if serial_data:
        parts = serial_data.split('|')
        lcd.clear()
        for i, part in enumerate(parts):
            if i < 2:
                lcd.set_cursor_pos(i, 0)
                lcd.print(part)

    event = keys.events.get()
    if event:
        if event.pressed:
            idx = event.key_number
            if idx == 0 or idx == 1: # Macros
                kbd.send(*shortcuts[idx])
                kbd.release_all()
            elif idx == 2: # Button 3: Toggle Games/Races
                print("CMD:NEXT")
            elif idx == 3: # Button 4: Toggle Sport (NBA <-> F1)
                print("CMD:TOGGLE_SPORT")
                lcd.clear()
                lcd.print("Changing Sport..")

    time.sleep(0.01)