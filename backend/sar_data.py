import rasterio
import matplotlib.pyplot as plt
import numpy as np

# افتح الملف
file_path = "backend/uploads/ICEYE_X11_QUICKLOOK_SLED_3339922_20240129T192207.tif"
with rasterio.open(file_path) as src:
    img = src.read(1)  # قراءة الباند الوحيدة
    profile = src.profile  # metadata

print("Image shape:", img.shape)
print("CRS:", profile["crs"])
print("Transform:", profile["transform"])
print("Data type:", profile["dtype"])

# عرض الصورة بالرمادي
plt.figure(figsize=(8, 6))
plt.imshow(img, cmap="gray")
plt.colorbar(label="Backscatter intensity")
plt.title("SAR Quicklook (Gray)")
plt.show()

# عرض الصورة بـ colormap ملون (jet)
plt.figure(figsize=(8, 6))
plt.imshow(img, cmap="jet")
plt.colorbar(label="Backscatter intensity")
plt.title("SAR Quicklook (Colormap)")
plt.show()

# Histogram للقيم
plt.figure(figsize=(7, 5))
plt.hist(img.ravel(), bins=256, color="blue", alpha=0.7)
plt.title("Histogram of SAR intensity")
plt.xlabel("Pixel value (0-255)")
plt.ylabel("Count")
plt.show()

# إحصائيات
mean_val = np.mean(img)
std_val = np.std(img)
print(f"Mean intensity = {mean_val:.2f}")
print(f"Standard deviation = {std_val:.2f}")
