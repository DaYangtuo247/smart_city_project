import json
import random

# 定义函数生成指定范围内的随机数
def random_coordinate(start, end):
    return round(random.uniform(start, end), 6)

# 读取point.json文件
with open("view//src//components//city_line_out.json", "r") as f:
    data = json.load(f)

# 遍历features列表，修改每个geometry的coordinates值
num = 0
for feature in data["features"]:
    num += 1
    # 修改coordinates值
    feature["geometry"]["coordinates"][0] = [ 114.256148,30.615884 ]

print(f'修改成功的数据量：{num}')

# 将修改后的数据写入point.json文件
with open("view//src//components//change_line_out.json", "w") as f:
    json.dump(data, f)
