# 打开文件并读取内容
with open('smart-city\python\wuhan.txt', 'r') as file:
    data = file.read()

# 以逗号分隔每个坐标对
coordinates = data.split(',')

# 格式化每个坐标对
formatted_coordinates = []
for i in range(0, len(coordinates), 2):
    coordinate_pair = [float(coordinates[i]), float(coordinates[i+1])]
    formatted_coordinates.append(coordinate_pair)
    if float(coordinates[i]) > 114.969000 and float(coordinates[i]) < 114.969099 and float(coordinates[i+1]) > 30.993900 and float(coordinates[i+1]) < 30.993999:
        print(f'坐标对{coordinate_pair}不合法')

# # 构建输出字符串
# output = ''
# for coordinate_pair in formatted_coordinates:
#     output += f'[{coordinate_pair[0]},{coordinate_pair[1]}],'

# # 去除最后一个逗号
# output = output[:-1]

# # 写入输出文件
# with open('smart-city\python\output.txt', 'w') as file:
#     file.write(output)
