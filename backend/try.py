import numpy as np
import matplotlib.pyplot as plt
from scipy import signal

# إعداد الإشارة
f = 120          # التردد الحقيقي
fs_high = 500    # sampling عالي
t_high = np.arange(0, 0.1, 1/fs_high)
x_high = np.sin(2 * np.pi * f * t_high)

# Downsampling بدون فلتر
fs_low = 250
new_len = int(len(x_high) * fs_low / fs_high)
x_low = signal.resample(x_high, new_len)
t_low = np.linspace(0, 0.1, new_len)

# رسم
plt.figure(figsize=(10,5))
plt.plot(t_high, x_high, label='Original (500Hz)', alpha=0.6)
plt.plot(t_low, x_low, 'o-', label='Downsampled (150Hz)', alpha=0.8)
plt.legend()
plt.title("Aliasing when Downsampling (No Filtering)")
plt.xlabel("Time [s]")
plt.ylabel("Amplitude")
plt.show()


