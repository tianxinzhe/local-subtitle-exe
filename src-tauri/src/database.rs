use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct HistoryRecord {
    pub id: i64,
    pub input_file: String,
    pub output_dir: String,
    pub language: String,
    pub precision_mode: bool,
    pub extract_audio: bool,
    pub extract_subtitle: bool,
    pub translate_subtitle: bool,
    pub status: String,
    pub created_at: String,
    pub output_files: Option<String>,
}

pub fn init_db() -> Result<Connection> {
    let mut path = dirs::data_dir().ok_or_else(|| rusqlite::Error::InvalidQuery)?;
    path.push("lemon-subtitle-studio");
    let _ = std::fs::create_dir_all(&path);
    path.push("history.db");
    
    let conn = Connection::open(path)?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            input_file TEXT NOT NULL,
            output_dir TEXT NOT NULL,
            language TEXT NOT NULL,
            precision_mode INTEGER NOT NULL,
            extract_audio INTEGER NOT NULL,
            extract_subtitle INTEGER NOT NULL,
            translate_subtitle INTEGER NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            output_files TEXT
        )",
        [],
    )?;
    
    Ok(conn)
}

pub fn add_history_record(record: &HistoryRecord) -> Result<i64> {
    let conn = init_db()?;
    conn.execute(
        "INSERT INTO history (
            input_file, output_dir, language, precision_mode, 
            extract_audio, extract_subtitle, translate_subtitle, 
            status, created_at, output_files
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params![
            record.input_file,
            record.output_dir,
            record.language,
            record.precision_mode,
            record.extract_audio,
            record.extract_subtitle,
            record.translate_subtitle,
            record.status,
            record.created_at,
            record.output_files
        ],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn get_history_records() -> Result<Vec<HistoryRecord>> {
    let conn = init_db()?;
    let mut stmt = conn.prepare("SELECT * FROM history ORDER BY created_at DESC")?;
    let records = stmt.query_map([], |row| {
        Ok(HistoryRecord {
            id: row.get(0)?,
            input_file: row.get(1)?,
            output_dir: row.get(2)?,
            language: row.get(3)?,
            precision_mode: row.get(4)?,
            extract_audio: row.get(5)?,
            extract_subtitle: row.get(6)?,
            translate_subtitle: row.get(7)?,
            status: row.get(8)?,
            created_at: row.get(9)?,
            output_files: row.get(10)?,
        })
    })?;
    
    records.collect()
}

pub fn update_history_record(id: i64, status: &str, output_files: Option<String>) -> Result<()> {
    let conn = init_db()?;
    conn.execute(
        "UPDATE history SET status = ?, output_files = ? WHERE id = ?",
        params![status, output_files, id],
    )?;
    Ok(())
}

pub fn delete_history_record(id: i64) -> Result<()> {
    let conn = init_db()?;
    conn.execute("DELETE FROM history WHERE id = ?", params![id])?;
    Ok(())
}

pub fn clear_history() -> Result<()> {
    let conn = init_db()?;
    conn.execute("DELETE FROM history", [])?;
    Ok(())
}