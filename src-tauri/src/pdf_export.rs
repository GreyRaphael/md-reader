use std::path::PathBuf;
use std::process::Command;

use serde::{Deserialize, Serialize};

use crate::pdf_utils::{current_millis, find_edge_executable, path_to_file_url};

#[derive(Debug, Serialize, Clone)]
pub struct PdfExportResult {
    pub out_path: String,
    pub elapsed_ms: u64,
    pub edge_path: String,
}

#[derive(Debug, Serialize, Clone)]
#[serde(tag = "kind", content = "message")]
pub enum PdfExportError {
    NoEdge(String),
    EdgeFailed(String),
    IoError(String),
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PdfExportOptions {
    pub html: String,
    pub out_path: String,
    pub edge_path: Option<String>,
}

#[tauri::command]
pub fn export_pdf_via_edge(
    opts: PdfExportOptions,
) -> Result<PdfExportResult, PdfExportError> {
    let edge = find_edge_executable(opts.edge_path.as_deref()).ok_or_else(|| {
        PdfExportError::NoEdge(
            "未找到 Microsoft Edge，请手动选择 msedge.exe 路径".into(),
        )
    })?;

    let tmp_dir = std::env::temp_dir();
    let stamp = current_millis();

    // Always write to ASCII-only temp paths to avoid CLI parsing/encoding issues.
    let tmp_html = tmp_dir.join(format!("md-reader-export-{}.html", stamp));
    std::fs::write(&tmp_html, &opts.html)
        .map_err(|e| PdfExportError::IoError(e.to_string()))?;

    let user_data_dir = tmp_dir.join(format!("md-reader-edge-{}", stamp));
    std::fs::create_dir_all(&user_data_dir)
        .map_err(|e| PdfExportError::IoError(e.to_string()))?;

    let temp_pdf = tmp_dir.join(format!("md-reader-out-{}.pdf", stamp));

    let final_out = PathBuf::from(&opts.out_path);
    if let Some(parent) = final_out.parent() {
        if !parent.as_os_str().is_empty() {
            std::fs::create_dir_all(parent).ok();
        }
    }

    let file_url = path_to_file_url(&tmp_html);

    let start = std::time::Instant::now();
    let mut cmd = Command::new(&edge);
    // Edge 132+ removed legacy --headless; must use --headless=new.
    cmd.arg("--headless=new");
    cmd.arg("--disable-gpu");
    cmd.arg("--no-sandbox");
    cmd.arg("--allow-file-access-from-files");
    cmd.arg("--disable-extensions");
    cmd.arg("--disable-features=IsolateOrigins,site-per-process");
    cmd.arg("--no-pdf-header-footer");
    cmd.arg("--no-margins");
    cmd.arg("--run-all-compositor-stages-before-draw");
    cmd.arg("--virtual-time-budget=15000");
    cmd.arg(format!("--user-data-dir={}", user_data_dir.display()));
    cmd.arg(format!("--print-to-pdf={}", temp_pdf.display()));
    cmd.arg(&file_url);

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }

    let output_result = cmd.output();
    let elapsed_ms = start.elapsed().as_millis() as u64;

    // Clean transient HTML & user-data-dir regardless of outcome.
    let _ = std::fs::remove_file(&tmp_html);
    let _ = std::fs::remove_dir_all(&user_data_dir);

    let output = output_result.map_err(|e| {
        let _ = std::fs::remove_file(&temp_pdf);
        PdfExportError::EdgeFailed(format!("无法启动 Edge: {}", e))
    })?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if !output.status.success() {
        let _ = std::fs::remove_file(&temp_pdf);
        let msg = format!(
            "Edge 退出码 {:?}\nstderr: {}\nstdout: {}",
            output.status.code(),
            stderr.trim(),
            stdout.trim()
        );
        return Err(PdfExportError::EdgeFailed(msg));
    }

    if !temp_pdf.exists() {
        return Err(PdfExportError::EdgeFailed(format!(
            "Edge 执行完成但 PDF 未生成\nstderr: {}\nstdout: {}",
            stderr.trim(),
            stdout.trim()
        )));
    }

    // Copy temp PDF to user-chosen final path (which may contain CJK / spaces).
    std::fs::copy(&temp_pdf, &final_out).map_err(|e| {
        let _ = std::fs::remove_file(&temp_pdf);
        PdfExportError::IoError(format!("拷贝 PDF 到目标位置失败: {}", e))
    })?;
    let _ = std::fs::remove_file(&temp_pdf);

    Ok(PdfExportResult {
        out_path: final_out.to_string_lossy().to_string(),
        elapsed_ms,
        edge_path: edge.to_string_lossy().to_string(),
    })
}
