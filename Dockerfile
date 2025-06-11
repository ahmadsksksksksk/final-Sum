# Gunakan image Python 3.10
FROM python:3.10-slim

# Buat folder kerja
WORKDIR /app

# Salin semua file
COPY . .

# Install dependencies dari requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Jalankan server menggunakan gunicorn
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:$PORT", "--timeout", "300", "--workers", "1"]
