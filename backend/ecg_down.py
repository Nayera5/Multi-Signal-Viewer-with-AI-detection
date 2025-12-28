import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.widgets import Slider

# ===== 1. Read CSV =====
df = pd.read_csv("backend/uploads/1st_ecg.csv")  # replace with your file path

# Take time + first 3 channels
time = df.iloc[:, 0].values       # first column = time
channels = df.iloc[:, 1:4].values # first 3 channels

# ===== 2. Initial plot =====
fig, axs = plt.subplots(3, 1, figsize=(10, 6), sharex=True)
plt.subplots_adjust(left=0.1, bottom=0.25)  # space for slider

lines = []
for i in range(3):
    line, = axs[i].plot(time, channels[:, i], label=f'Channel {i+1}')
    axs[i].set_ylabel(f'Ch {i+1}')
    lines.append(line)

axs[2].set_xlabel('Time (s)')

# ===== 3. Add slider =====
ax_slider = plt.axes([0.1, 0.1, 0.8, 0.03])
slider = Slider(ax_slider, 'Downsample factor', valmin=1, valmax=10, valinit=1, valstep=1)

# ===== 4. Slider update function =====
def update(val):
    M = int(slider.val)  # downsample factor
    t_down = time[::M]
    for i in range(3):
        ch_down = channels[:, i][::M]
        lines[i].set_data(t_down, ch_down)
        axs[i].relim()      # recompute limits
        axs[i].autoscale_view()
    fig.canvas.draw_idle()

slider.on_changed(update)

plt.show()
