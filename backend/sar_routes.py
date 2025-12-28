from flask import Blueprint, jsonify, request
import rasterio
import numpy as np
import base64
import io
import matplotlib
matplotlib.use('Agg')  
import matplotlib.pyplot as plt

sar_bp = Blueprint('sar', __name__)

# Use the hardcoded file paths
SAR_FILE_MINE = "uploads/Mine.tif"
SAR_FILE_ROTTERDAM = "uploads/rotterdam.tif"

@sar_bp.route('/analyze_sar', methods=['GET'])
def analyze_sar():
    downsample_factor = request.args.get('factor', 1, type=int)
    
    try:
        # Process Mine image
        def processImg(SAR_FILE, factor=1):
            with rasterio.open(SAR_FILE) as src:
                img = src.read(1)
                profile = src.profile
                
                # Apply downsampling if factor > 1
                if factor > 1:
                    img = img[::factor, ::factor]
                
                return img, profile
     
        def calculate_statistics(img):
            return {
                "mean": float(np.mean(img)),
                "std": float(np.std(img)),
                "min": float(np.min(img)),
                "max": float(np.max(img))
            }
        
               

        img_mine, profile_mine = processImg(SAR_FILE_MINE, downsample_factor)
        img_rotterdam, profile_rotterdam = processImg(SAR_FILE_ROTTERDAM, downsample_factor)

        stats_mine = calculate_statistics(img_mine)
        
        # Calculate statistics for Rotterdam
        stats_rotterdam = calculate_statistics(img_rotterdam)

      
        # Generate images for Mine
        gray_img_mine = generate_image(img_mine, 'gray', f'Mine ({downsample_factor}x downsampled)')
        color_img_mine = generate_image(img_mine, 'jet', f'Mine ({downsample_factor}x downsampled)')
        histogram_img_mine = generate_histogram(img_mine, f'Mine ({downsample_factor}x downsampled)')
        
        # Generate images for Rotterdam
        gray_img_rotterdam = generate_image(img_rotterdam, 'gray', f'Port ({downsample_factor}x downsampled)')
        color_img_rotterdam = generate_image(img_rotterdam, 'jet', f'Port ({downsample_factor}x downsampled)')
        histogram_img_rotterdam = generate_histogram(img_rotterdam, f'Port ({downsample_factor}x downsampled)')
        
        return jsonify({
            "status": "success",
            "downsample_factor": downsample_factor,
            "mine": {
                "metadata": {
                    "shape": img_mine.shape,
                    "crs": str(profile_mine.get("crs", "N/A")),
                    "dtype": str(profile_mine["dtype"])
                },
                "statistics": {
                    "mean":stats_mine["mean"],
                    "std": stats_mine["std"],
                    "min": stats_mine["min"],
                    "max": stats_mine["max"]
                },
                "images": {
                    "grayscale": gray_img_mine,
                    "colormap": color_img_mine,
                    "histogram": histogram_img_mine
                }
            },
            "rotterdam": {
                "metadata": {
                    "shape": img_rotterdam.shape,
                    "crs": str(profile_rotterdam.get("crs", "N/A")),
                    "dtype": str(profile_rotterdam["dtype"])
                },
                "statistics": {
                    "mean": stats_rotterdam["mean"],
                    "std": stats_rotterdam["std"],
                    "min": stats_rotterdam["min"],
                    "max": stats_rotterdam["max"]
                },
                "images": {
                    "grayscale": gray_img_rotterdam,
                    "colormap": color_img_rotterdam,
                    "histogram": histogram_img_rotterdam
                }
            },
        })
    
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

def generate_image(data, cmap, title):
    """Generate base64 encoded image"""
    fig, ax = plt.subplots(figsize=(8, 6))
    im = ax.imshow(data, cmap=cmap)
    plt.colorbar(im, ax=ax, label="Backscatter intensity")
    ax.set_title(f"SAR Image - {title}", fontsize=10)
    ax.axis('off')
    
    # Save to bytes with lower DPI for faster processing
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', dpi=75)
    plt.close(fig)
    buf.seek(0)
    
    # Encode to base64
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    return f"data:image/png;base64,{img_base64}"

def generate_histogram(data, title):
    """Generate histogram as base64 encoded image"""
    fig, ax = plt.subplots(figsize=(7, 5))
    ax.hist(data.ravel(), bins=256, color="blue", alpha=0.7)
    ax.set_title(f"Histogram of SAR intensity - {title}")
    ax.set_xlabel("Pixel value")
    ax.set_ylabel("Count")
    ax.grid(True, alpha=0.3)
    
    # Save to bytes with lower DPI for faster processing
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', dpi=75)
    plt.close(fig)
    buf.seek(0)
    
    # Encode to base64
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    return f"data:image/png;base64,{img_base64}"
