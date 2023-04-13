import json
import random

# 定义函数生成指定范围内的随机数
def random_coordinate(start, end):
    return round(random.uniform(start, end), 6)

# 读取point.json文件
with open("view//src//components//point.json", "r") as f:
    data = json.load(f)

# 遍历features列表，修改每个geometry的coordinates值
num = 0
for feature in data["features"]:
    # 生成两个随机坐标值
    random_longitude = random_coordinate(114.21924, 114.225078)
    random_latitude = random_coordinate(30.65057, 30.657394)
    num += 1
    # 修改coordinates值
    feature["geometry"]["coordinates"] = [random_longitude, random_latitude]

print(f'修改成功的数据量：{num}')

# 将修改后的数据写入point.json文件
with open("view//src//components//change_point.json", "w") as f:
    json.dump(data, f)
