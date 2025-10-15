# ISL Admin API Specifications
## Assumptions
* Only 1 ISL Bible with 66 books.
* One chapter = one video.
* Each chapter has verse markers.
* Each book can have an intro video.
* Each chapter can have an intro in the first few seconds of the video.
* Verse marker format: `verse, time_marker`
* Books are pre-populated; only chapter videos and verse markers are added.

---

## 1. Videos for Each Chapter

**Base URL:** `/video`

### **1.A POST - Upload CSV of Chapter Videos**

* **Description:** Upload a CSV file containing video URLs for chapters.
* **CSV Format:** `book_code,chapter,video_id`
* **Example CSV:** [isl_video_urls.csv](https://github.com/Bridgeconn/isl-manzil-web/blob/main/src/assets/data/isl_video_urls.csv)
* **Request:**

  ```
  POST /video
  Content-Type: multipart/form-data
  Body: file=<CSV file>
  ```
* **Response:**

  ```json
  {
    "success": true,
    "message": "Chapter videos uploaded successfully"
  }
  ```

### **1.B PUT - Update Chapter Video**

* **Description:** Update video for a specific chapter using `book_code` and `chapter`.
* **Request:**

  ```
  PUT /video
  Content-Type: multipart/form-data
  Body: file=<CSV file>
  ```
* **Response:**

  ```json
  {
    "success": true,
    "message": "Chapter video updated successfully"
  }
  ```

### **1.C DELETE - Delete Videos for Full Books**

* **Description:** Delete all videos for the given books.
* **Request:**

  ```json
  DELETE /video
  {
    "books": ["gen", "exo"]
  }
  ```
* **Response:**

  ```json
  {
    "success": true,
    "message": "Videos deleted for selected books"
  }
  ```

### **1.D GET - Get Videos of a Book**

* **Description:** Fetch all chapter videos of a book.
* **Request:**

  ```
  GET /video/book/<book_code>
  ```
* **Response:**

  ```json
  {
    "book_code": "gen",
    "chapters": [
      {"chapter": 1, "video_id": "abcd123"},
      {"chapter": 2, "video_id": "efgh456"}
    ]
  }
  ```

---

## 2. Verse Markers

**Base URL:** `/verse_markers`

### **2.A POST - Upload Zip of Verse Markers**

* **Description:** Upload a zip containing all chapter verse markers. Each file should be `book_chapter.csv`.
* **Example Folder:** [verse_markers](https://github.com/Bridgeconn/isl-manzil-web/tree/main/src/assets/data/verse_markers)
* **Request:**

  ```
  POST /verse_markers
  Content-Type: multipart/form-data
  Body: file=<zip file>
  ```
* **Response:**

  ```json
  {
    "success": true,
    "message": "Verse markers uploaded successfully"
  }
  ```

### **2.B PUT - Update Verse Markers for One Chapter**

* **Description:** Update verse markers for a specific chapter. If CSV is missing, delete full chapter markers; otherwise, update.
* **Example CSV:** [Exodus_1.csv](https://github.com/Bridgeconn/isl-manzil-web/blob/main/src/assets/data/verse_markers/Exodus_1.csv)
* **Request:**

  ```
  PUT /verse_markers
  Content-Type: multipart/form-data
  Body: file=<CSV file>
  ```
* **Response:**

  ```json
  {
    "success": true,
    "message": "Verse markers updated successfully"
  }
  ```

### **2.C DELETE - Delete Verse Markers for Full Books**

* **Description:** Delete all verse markers for the given books.
* **Request:**

  ```json
  DELETE /verse_markers
  {
    "books": ["gen", "exo"]
  }
  ```
* **Response:**

  ```json
  {
    "success": true,
    "message": "Verse markers deleted for selected books"
  }
  ```

### **2.D GET - Get Verse Markers for a Chapter**

* **Description:** Fetch verse markers of a single chapter.
* **Request:**

  ```
  GET /verse_markers/chapter/<book_code>_<chapter>
  ```
* **Example:**

  ```
  GET /verse_markers/chapter/gen_1
  ```
* **Response:**

  ```json
  {
    "book_code": "gen",
    "chapter": 1,
    "verse_markers": [
      {"verse": 1, "time_marker": "00:00:10"},
      {"verse": 2, "time_marker": "00:00:15"}
    ]
  }
  ```

---

**Notes:**

* All file uploads should be `multipart/form-data`.
* CSV headers must match the specified formats.
* ZIP uploads for verse markers should contain CSV files named as `Book_Chapter.csv`.
