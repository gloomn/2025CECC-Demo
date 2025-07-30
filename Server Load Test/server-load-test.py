#사용법
#ip, port 입력 후 -> 50개의 클라이언트가 서버에 연결될 것임
#다 연결된 후 SUBMIT_ANSWER을 50번 입력하면 서버에 답을 보냄
#부하 테스트 하면 됨.

import socket
import threading
import json

def connect_to_server(nickname, server_ip, server_port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((server_ip, server_port))
        
        # JSON 형식으로 CONNECT 메시지 생성
        connect_msg = {
            "type": "CONNECT",
            "nickname": nickname,
            "problem": '0',  # 초기 문제 번호
            "score": 0       # 초기 점수
        }
        
        # CONNECT 메시지를 바이트로 변환하여 서버로 전송
        s.sendall(json.dumps(connect_msg).encode('utf-8'))
        
        # 서버로부터 응답 받기
        data = s.recv(1024)
        print(f'{nickname} Received from server: {data.decode("utf-8")}')
        
        # 사용자로부터 SUBMIT_ANSWER 명령을 입력받음
        while True:
            command = input(f"{nickname}, enter 'SUBMIT_ANSWER' to submit your answer (or 'exit' to quit): ")
            if command.strip().upper() == "SUBMIT_ANSWER":
                # SUBMIT_ANSWER 메시지 생성
                problem_id = 1  # 문제 번호 (예: 문제 1)
                answer = '4'    # 제출할 답 (예: 답 4)
                
                submit_msg = {
                    "type": "SUBMIT_ANSWER",
                    "nickname": nickname,
                    "problem": problem_id,  # 문제 번호
                    "answer": answer        # 제출한 답
                }

                # SUBMIT_ANSWER 메시지를 서버로 전송
                s.sendall(json.dumps(submit_msg).encode('utf-8'))
                
                # 서버로부터 응답 받기 (점수 등)
                data = s.recv(1024)
                print(f'{nickname} Received from server after submitting answer: {data.decode("utf-8")}')
                break
            elif command.strip().lower() == 'exit':
                print(f"{nickname} exited.")
                break
            else:
                print("Invalid command. Please type 'SUBMIT_ANSWER' to submit your answer or 'exit' to quit.")

# 서버 IP와 포트를 사용자로부터 입력받음
server_ip = input("Enter the server IP: ")
server_port = int(input("Enter the server port: "))

# 50개의 클라이언트 스레드를 생성하여 각각 'test1', 'test2', ..., 'test50' 이름으로 서버에 연결
threads = []
for i in range(1, 51):
    nickname = f'test{i}'  # 클라이언트의 닉네임 설정
    t = threading.Thread(target=connect_to_server, args=(nickname, server_ip, server_port))
    t.start()
    threads.append(t)

# 모든 스레드가 완료될 때까지 기다림
for t in threads:
    t.join()
