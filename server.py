# -*- coding: utf-8 -*-
"""
建生工坊線上拍賣系統 - 本機專用 HTTP 伺服器 (server.py)
功能：
1. 靜態檔案託管 (HTML, JS, CSS, MP4, 圖片等)
2. 跨來源資源共享 (CORS) 支援，允許 file:/// 協定向本伺服器通信
3. POST /__save_my_data__ 端點：接收拍賣資料並儲存至 my_auction_data.json
4. GET /my_auction_data.json 端點：提供最新拍賣資料
"""

import os
import sys
import json
import socket
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 8080
if len(sys.argv) > 1:
    try:
        PORT = int(sys.argv[1])
    except ValueError:
        pass

DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'my_auction_data.json')

def get_lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        try:
            return socket.gethostbyname(socket.gethostname())
        except Exception:
            return '127.0.0.1'

class AuctionServerHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # 加入 CORS 標頭，允許任何來源（包含 file:// 協定頁面）呼叫
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        # 處理 CORS 預檢請求 (Preflight)
        self.send_response(200, "OK")
        self.end_headers()

    def do_POST(self):
        if self.path == '/__save_my_data__' or self.path.startswith('/__save_my_data__'):
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_body = self.rfile.read(content_length).decode('utf-8')
                incoming_data = json.loads(post_body)

                # 讀取現有既有檔案資料
                final_data = {}
                if os.path.exists(DATA_FILE):
                    try:
                        with open(DATA_FILE, 'r', encoding='utf-8') as f:
                            final_data = json.load(f)
                    except Exception:
                        final_data = {}

                existing_items = final_data.get('items', [])
                force_delete_all = incoming_data.get('forceDeleteAll') is True if isinstance(incoming_data, dict) else False

                # 處理傳入資料
                if isinstance(incoming_data, dict):
                    extracted_items = None
                    if 'items' in incoming_data:
                        extracted_items = incoming_data['items']
                    else:
                        for key in ['agy_items', 'auctionItems']:
                            if key in incoming_data:
                                val = incoming_data[key]
                                if isinstance(val, str):
                                    try: val = json.loads(val)
                                    except: pass
                                if isinstance(val, list):
                                    extracted_items = val
                                    break

                    # 嚴格防清空防覆蓋機制：
                    # 若傳來的商品清單是空的（或未包含有效商品），且原本 my_auction_data.json 內有商品資料，
                    # 且非明確 forceDeleteAll 標記，則拒絕覆蓋 items！
                    if (extracted_items is None or len(extracted_items) == 0) and (existing_items and len(existing_items) > 0) and not force_delete_all:
                        print("[GUARD] 偵測到傳入之商品清單為空，啟動防清空保護：保留既有 Acer 筆電商品資料，拒絕覆蓋！")
                        final_data['items'] = existing_items
                    elif extracted_items is not None and len(extracted_items) > 0:
                        # 檢查傳入的 items：如果傳入的商品圖片為空但既有商品有 28 張實拍照，進行圖片保護
                        for new_it in extracted_items:
                            if not new_it.get('images') or len(new_it.get('images', [])) == 0:
                                matched_orig = next((orig for orig in existing_items if orig.get('id') == new_it.get('id')), None)
                                if matched_orig and matched_orig.get('images') and len(matched_orig['images']) > 0:
                                    print(f"[GUARD] 自動恢復商品【{new_it.get('name', '')[:20]}】的既有 {len(matched_orig['images'])} 張實拍照，防止圖片被洗空！")
                                    new_it['images'] = matched_orig['images']
                        final_data['items'] = extracted_items

                    # 檢查工作室名稱與設定
                    for key in ['agy_studio_name', 'studioName']:
                        if key in incoming_data and incoming_data[key]:
                            final_data['studioName'] = incoming_data[key]
                            final_data['agy_studio_name'] = incoming_data[key]

                    for key in ['agy_studio_logo', 'studioLogo']:
                        if key in incoming_data and incoming_data[key]:
                            final_data['studioLogo'] = incoming_data[key]

                    for key in ['agy_studio_logo_cfg', 'logoConfig']:
                        if key in incoming_data and incoming_data[key]:
                            val = incoming_data[key]
                            if isinstance(val, str):
                                try: val = json.loads(val)
                                except: pass
                            final_data['logoConfig'] = val

                    for key in ['agy_last_auction_id', 'auctionId']:
                        if key in incoming_data and incoming_data[key]:
                            final_data['agy_last_auction_id'] = incoming_data[key]

                    if 'baseCurrency' in incoming_data and incoming_data['baseCurrency']:
                        final_data['baseCurrency'] = incoming_data['baseCurrency']

                # 寫回 my_auction_data.json
                with open(DATA_FILE, 'w', encoding='utf-8') as f:
                    json.dump(final_data, f, ensure_ascii=False, indent=2)

                response_body = json.dumps({'status': 'ok', 'message': 'Auction data successfully saved to my_auction_data.json'}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', str(len(response_body)))
                self.end_headers()
                self.wfile.write(response_body)
                print(f"[SUCCESS] 拍賣資料已成功儲存至 {DATA_FILE}")
            except Exception as e:
                err_msg = json.dumps({'status': 'error', 'message': str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', str(len(err_msg)))
                self.end_headers()
                self.wfile.write(err_msg)
                print(f"[ERROR] 儲存失敗: {e}")
        else:
            self.send_error(404, "Not Found")

    def do_GET(self):
        if self.path == '/favicon.ico':
            self.path = '/icon-192.png'
        elif self.path == '/__server_info__' or self.path.startswith('/__server_info__'):
            lan_ip = get_lan_ip()
            info = {
                'lanIp': lan_ip,
                'port': PORT,
                'lanUrl': f'http://{lan_ip}:{PORT}',
                'localUrl': f'http://localhost:{PORT}'
            }
            body = json.dumps(info).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def guess_type(self, path):
        # 擴充 MIME 類型支援
        if path.endswith('/favicon.ico'):
            return 'image/png'
        mtype = super().guess_type(path)
        if path.endswith('.js'):
            return 'application/javascript; charset=utf-8'
        elif path.endswith('.json'):
            return 'application/json; charset=utf-8'
        elif path.endswith('.css'):
            return 'text/css; charset=utf-8'
        elif path.endswith('.html') or path.endswith('.htm'):
            return 'text/html; charset=utf-8'
        elif path.endswith('.mp4'):
            return 'video/mp4'
        elif path.endswith('.webm'):
            return 'video/webm'
        return mtype

def run_server():
    server_address = ('', PORT)
    HTTPServer.allow_reuse_address = True
    httpd = HTTPServer(server_address, AuctionServerHandler)
    lan_ip = get_lan_ip()
    print("=" * 60)
    print(f"建生工坊拍賣系統本機伺服器已啟動:")
    print(f"  - 本機瀏覽器: http://localhost:{PORT}")
    print(f"  - 手機/區網瀏覽器: http://{lan_ip}:{PORT}")
    print(f"拍賣資料檔案路徑: {DATA_FILE}")
    print("按 Ctrl+C 可停止伺服器")
    print("=" * 60)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n伺服器正在停止...")
        httpd.server_close()

if __name__ == '__main__':
    run_server()

