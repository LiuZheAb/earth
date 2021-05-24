# -*- coding: utf-8 -*-
"""
Created on Sat Apr 24 09:35:50 2021

@author: 86156
"""


from flask import Flask,jsonify, request
from flask_cors import CORS
from flask_restful import reqparse,  Api, Resource
from flasgger import Swagger
import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt      #python画出散点图
from scipy.interpolate import griddata
import scipy.io as sio



app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False
CORS(app, supports_credentials=True)
api = Api(app)

UPLOAD_PATH = os.path.abspath('.')

swagger_config = Swagger.DEFAULT_CONFIG
swagger_config['title'] = '重磁数据联合反演接口'          # 配置大标题
swagger_config['description'] = '重磁数据联合反演功能'    # 配置公共描述内容
swagger_config['host'] = '202.127.3.157:5052'            # 请求域名
swagger_config['optional_fields'] = ['components']       # 请求域名

swagger = Swagger(app,  config=swagger_config)
APIKEY = 'cea2009'



@app.route('/', methods=['POST','GET'])
def hello():
    return '1'


def parserinfo(parser):
    '''Only for internal using
    Returns
    -------
    None.'''
#    parser.add_argument('regu', type=str,  required=False, help='regularization method')
    parser.add_argument('deriv_direction', type=str,  required=False, help='deriv_direction')
    parser.add_argument('mag_component', type=str,  required=False, help='deriv_direction')
    parser.add_argument('g_component', type=str,  required=False, help='g_component')

    parser.add_argument('den_region_1', type=str, required=False, help='设置密度区域')

    parser.add_argument('density_1', type=str, default = 0.5, required=False, help='设置密度值')
#模型大小设置
    parser.add_argument('area', type=str, required=False, help='模型大小设置')
    parser.add_argument('xNum', type=str, required=False, help='xNum')
    parser.add_argument('yNum', type=str, required=False, help='yNum')
    parser.add_argument('am', type=str, required=False, help='am')
    parser.add_argument('ax', type=str, required=False, help='ax')
    parser.add_argument('ay', type=str, required=False, help='ay')
    parser.add_argument('az', type=str, required=False, help='az')
    parser.add_argument('z00', type=str, required=False, help='z00')
    parser.add_argument('beta', type=str, required=False, help='beta')


#模型分层

    parser.add_argument('shape', type=str, required=False, help='模型网格划分')

#观测区域划分
    parser.add_argument('narea', type=str, required=False, help='观测区域设置')

#观测区域网格划分
    parser.add_argument('nshape', type=str, required=False, help='观测区域设置')

#观测面深度

    args = parser.parse_args()
    ip = request.remote_addr
    platform = request.user_agent.platform
    browser = request.user_agent.browser
    apilog = 'A call from IP: {},System: {},Browser: {}'.format(ip, platform, browser)
    #geoist.log.info('API message:{}'.format(apilog))

    return args



class gm_cross_gradient_2D(Resource):


    def post(self):

        '''重磁2D数据交叉梯度联合反演
        ---
        tags:
          - 重磁2D数据交叉梯度联合反演

        parameters:
        - name: z0
          in: query
          type: number
          required: flase
          default: 0.0
          description: 观测面深度
          
        - name: cengshu
          in: query
          type: number
          required: true
          default: 20
          description: 场源剖分层数

        - name: x_number
          in: query
          type: number
          required: true
          default: 40
          description: 场源X方向剖分个数
         
        - name: zzmax
          in: query
          type: number
          required: true
          default: 1000
          description: depth
          
        - name: f_name1
          in: formData
          type: file
          required: true
          description: gravity anomaly

        - name: f_name2
          in: formData
          type: file
          required: true
          description: magnetic anomaly
          
        - name: f_name3
          in: formData
          type: file
          required: true
          description: initial_gravity_model

        - name: f_name4
          in: formData
          type: file
          required: true
          description: initial_magnetic_model
                            
        - name: B
          in: query
          type: number
          default: 50000
          required: true
          description: 地磁场磁感应强度
          
        - name: tz
          in: query
          type: number
          default: 90
          required: true
          description: 地磁场倾角

        - name: tx
          in: query
          type: number
          default: 0.0
          required: true
          description: 地磁场偏角

        - name: az
          in: query
          type: number
          default: 90
          required: true
          description: 源磁化倾角

        - name: ax
          in: query
          type: number
          default: 0.0
          required: true
          description: 源磁化偏角
          
        - name: max_iteration
          in: query
          type: number
          default: 100
          required: true
          description: 最大迭代次数

        - name: b_low_g
          in: query
          type: number
          required: true
          default: 0.0
          description: 密度正定约束最小值
          
        - name: b_up_g
          in: query
          type: number
          required: true
          default: 2
          description: 密度正定约束最大值
          
        - name: b_low_m
          in: query
          type: number
          required: true
          default: 0.0
          description: 磁化强度正定约束最小值
       
        - name: b_up_m
          in: query
          type: number
          required: true
          default: 2
          description: 磁化强度正定约束最大值

        - name: beta
          in: query
          type: number
          required: true
          default: 0.1
          description: 弹性网正则化约束项参数一 (0.0——1.0)

        - name: alpha
          in: query
          type: number
          required: true
          default: 0.01
          description: 弹性网正则化约束项参数二 (0.0——1.0)

        - name: lam_g
          in: query
          type: number
          required: true
          default: 100000.0
          description: 重力交叉梯度约束项因子

        - name: lam_m
          in: query
          type: number
          required: true
          default: 100000.0
          description: 磁力交叉梯度约束项因子

        responses:
          200:
            description: 重磁2D交叉梯度联合反演+重加权+模型加权+弹性网正则化
        '''
        

        #变量定义
        parser = reqparse.RequestParser(bundle_errors=True)
        parser.add_argument('z0', type=str, required=False, help='观测面深度')
        parser.add_argument('B', type=str, required=False, help='B')
        parser.add_argument('tz', type=str, required=False, help='tz')
        parser.add_argument('tx', type=str, required=False, help='tx')
        parser.add_argument('az', type=str, required=False, help='az')
        parser.add_argument('ax', type=str, required=False, help='ax')
        parser.add_argument('cengshu', type=str, required=False, help='场源剖分层数')
        parser.add_argument('x_number', type=str, required=False, help='X方向剖分个数')
        parser.add_argument('zzmax', type=str, required=False, help='剖分深度')
        parser.add_argument('lam_g', type=str, required=False, help='交叉梯度重力权重')
        parser.add_argument('lam_m', type=str, required=False, help='交叉梯度磁力权重')
        parser.add_argument('b_low_g', type=str, required=False, help='密度正定约束下限')
        parser.add_argument('b_up_g', type=str, required=False, help='密度正定约束上限')
        parser.add_argument('b_low_m', type=str, required=False, help='磁化强度正定约束下限')
        parser.add_argument('b_up_m', type=str, required=False, help='磁化强度正定约束上限')
        parser.add_argument('beta', type=str, required=False, help='弹性网正则化约束项参数1')
        parser.add_argument('alpha', type=str, required=False, help='弹性网正则化约束项参数2')
        parser.add_argument('max_iteration', type=str, required=False, help='最大迭代次数')
        args = parserinfo(parser)
 

        #数据转换格式
        z0=float(args['z0'])
        B= float(args['B'])
        tz= float(args['tz'])
        tx= float(args['tx'])
        az= float(args['az'])
        ax= float(args['ax'])
        cengshu= int(args['cengshu'])
        x_number= int(args['x_number'])
        zzmax= float(args['zzmax'])
        lam_g= float(args['lam_g'])
        lam_m= float(args['lam_m'])
        b_low_g= float(args['b_low_g'])
        b_up_g= float(args['b_up_g'])
        b_low_m= float(args['b_low_m'])
        b_up_m= float(args['b_up_m'])
        beta = float(args['beta'])
        alpha= float(args['alpha'])
        max_iteration=  int(args['max_iteration'])
       

        #读取文件
        uploaded_file = request.files['f_name1']
        gradata = pd.read_csv(uploaded_file)
        lon=gradata['x'] 
        d_obs_g=gradata['data']
        x_coordinate= lon.values
        n_coordinate=int(len(x_coordinate))
        
        
        uploaded_file1 = request.files['f_name2']
        gradata1 = pd.read_csv(uploaded_file1)
        d_obs_m = gradata1['data']
               
        
        uploaded_file2 = request.files['f_name3']
        gradata2 = pd.read_csv(uploaded_file2)
        density = gradata2['data']
        n_source=int(len(density))
        
        
        uploaded_file3 = request.files['f_name4']
        gradata3 = pd.read_csv(uploaded_file3)
        magnetization=gradata3['data']
        x_cor= np.zeros(n_source);
        z_cor= np.zeros(n_source);
        
        from cross_2d import cross_gradinv as f
        

        #函数调用
        f.gm_2d_cross_gradinv(\
            z0,B,tz,tx,az,ax,cengshu,x_number,max_iteration,zzmax,lam_g,lam_m,\
            b_low_g,b_up_g,b_low_m,b_up_m,beta,alpha,x_coordinate,\
            n_source,n_coordinate,density,magnetization,d_obs_g,d_obs_m,x_cor,z_cor)                                                                         
        
            
        dataframe=pd.DataFrame({'x':x_cor.ravel(),'z':z_cor.ravel(),\
                                'den':density.ravel(),'mag':magnetization.ravel()})

        v1 = {
        'x' : list(dataframe['x'][:].ravel()),
        'z' : list(dataframe['z'][:].ravel()),
        'density' : list(dataframe['den'][:].ravel()),
        'magnetization' : list(dataframe['mag'][:].ravel()),
        }    


        return jsonify(v1)
    
    
    
class gm_cross_gradient_3D(Resource):


    def post(self):

        '''重磁3D数据交叉梯度联合反演
        ---
        tags:
          - 重磁3D数据交叉梯度联合反演

        parameters:
        - name: z0
          in: query
          type: number
          required: flase
          default: 0.0
          description: 观测面深度
          
        - name: cengshu
          in: query
          type: number
          required: true
          default: 10
          description: 场源剖分层数

        - name: x_number
          in: query
          type: number
          required: true
          default: 20
          description: 场源X方向剖分个数
          
        - name: y_number
          in: query
          type: number
          required: true
          default: 20
          description: 场源y方向剖分个数
          
        - name: x_n_coordinate
          in: query
          type: number
          required: true
          default: 21
          description: 测网X方向的测点数
          
        - name: y_n_coordinate
          in: query
          type: number
          required: true
          default: 21
          description: 测网Y方向的测点数
          
        - name: zzmax
          in: query
          type: number
          required: true
          default: 500
          description: depth
          
        - name: f_name1
          in: formData
          type: file
          required: true
          description: gravity anomaly

        - name: f_name2
          in: formData
          type: file
          required: true
          description: magnetic anomaly
          
        - name: f_name3
          in: formData
          type: file
          required: true
          description: initial_gravity_model

        - name: f_name4
          in: formData
          type: file
          required: true
          description: initial_magnetic_model
          
        - name: B
          in: query
          type: number
          default: 50000
          required: true
          description: 地磁场磁感应强度
          
        - name: tz
          in: query
          type: number
          default: 90
          required: true
          description: 地磁场倾角

        - name: tx
          in: query
          type: number
          default: 0.0
          required: true
          description: 地磁场偏角

        - name: az
          in: query
          type: number
          default: 90
          required: true
          description: 源磁化倾角

        - name: ax
          in: query
          type: number
          default: 0.0
          required: true
          description: 源磁化偏角
          
        - name: max_iteration
          in: query
          type: number
          default: 100
          required: true
          description: 最大迭代次数

        - name: b_low_g
          in: query
          type: number
          required: true
          default: 0.0
          description: 密度正定约束最小值
          
        - name: b_up_g
          in: query
          type: number
          required: true
          default: 2
          description: 密度正定约束最大值
          
        - name: b_low_m
          in: query
          type: number
          required: true
          default: 0.0
          description: 磁化强度正定约束最小值
       
        - name: b_up_m
          in: query
          type: number
          required: true
          default: 2
          description: 磁化强度正定约束最大值

        - name: beta
          in: query
          type: number
          required: true
          default: 0.1
          description: 弹性网正则化约束项参数一 (0.0——1.0)

        - name: alpha
          in: query
          type: number
          required: true
          default: 0.01
          description: 弹性网正则化约束项参数二 (0.0——1.0)

        - name: lam_g
          in: query
          type: number
          required: true
          default: 1000.0
          description: 重力交叉梯度约束项因子

        - name: lam_m
          in: query
          type: number
          required: true
          default: 1000.0
          description: 磁力交叉梯度约束项因子

        responses:
          200:
            description: 重磁3D交叉梯度联合反演+重加权+模型加权+弹性网正则化
        '''
        

        #变量定义
        parser = reqparse.RequestParser(bundle_errors=True)
        parser.add_argument('z0', type=str, required=False, help='观测面深度')
        parser.add_argument('B', type=str, required=False, help='B')
        parser.add_argument('tz', type=str, required=False, help='tz')
        parser.add_argument('tx', type=str, required=False, help='tx')
        parser.add_argument('az', type=str, required=False, help='az')
        parser.add_argument('ax', type=str, required=False, help='ax')
        parser.add_argument('cengshu', type=str, required=False, help='场源剖分层数')
        parser.add_argument('x_number', type=str, required=False, help='X方向剖分个数')
        parser.add_argument('y_number', type=str, required=False, help='y方向剖分个数')
        parser.add_argument('x_n_coordinate', type=str, required=False, help='X方向测点个数')
        parser.add_argument('y_n_coordinate', type=str, required=False, help='y方向测点个数')
        parser.add_argument('zzmax', type=str, required=False, help='剖分深度')
        parser.add_argument('lam_g', type=str, required=False, help='交叉梯度重力权重')
        parser.add_argument('lam_m', type=str, required=False, help='交叉梯度磁力权重')
        parser.add_argument('b_low_g', type=str, required=False, help='密度正定约束下限')
        parser.add_argument('b_up_g', type=str, required=False, help='密度正定约束上限')
        parser.add_argument('b_low_m', type=str, required=False, help='磁化强度正定约束下限')
        parser.add_argument('b_up_m', type=str, required=False, help='磁化强度正定约束上限')
        parser.add_argument('beta', type=str, required=False, help='弹性网正则化约束项参数1')
        parser.add_argument('alpha', type=str, required=False, help='弹性网正则化约束项参数2')
        parser.add_argument('max_iteration', type=str, required=False, help='最大迭代次数')
        args = parserinfo(parser)
        
        

        #数据转换格式
        z0=float(args['z0'])
        B= float(args['B'])
        tz= float(args['tz'])
        tx= float(args['tx'])
        az= float(args['az'])
        ax= float(args['ax'])
        cengshu= int(args['cengshu'])
        x_number= int(args['x_number'])
        y_number= int(args['y_number'])
        x_n_coordinate= int(args['x_n_coordinate'])
        y_n_coordinate= int(args['y_n_coordinate'])
        zzmax= float(args['zzmax'])
        lam_g= float(args['lam_g'])
        lam_m= float(args['lam_m'])
        b_low_g= float(args['b_low_g'])
        b_up_g= float(args['b_up_g'])
        b_low_m= float(args['b_low_m'])
        b_up_m= float(args['b_up_m'])
        beta = float(args['beta'])
        alpha= float(args['alpha'])
        max_iteration=  int(args['max_iteration'])


        #读取文件
        uploaded_file = request.files['f_name1']
        gradata = pd.read_csv(uploaded_file)
        lon=gradata['x'] 
        lat=gradata['y'] 
        d_obs_g=gradata['data']
        x_coordinate= lon.values
        y_coordinate= lat.values
        n_coordinate=int(len(x_coordinate))
      
        
        uploaded_file1 = request.files['f_name2']
        gradata1 = pd.read_csv(uploaded_file1)
        d_obs_m=gradata1['data']
    
        
        uploaded_file2 = request.files['f_name3']
        gradata2 = pd.read_csv(uploaded_file2)
        density= gradata2['data']
        n_source=int(len(density))
        
        
        uploaded_file3 = request.files['f_name4']
        gradata3 = pd.read_csv(uploaded_file3)
        magnetization= gradata3['data']
                
        
        x_cor= np.zeros(n_source);
        y_cor= np.zeros(n_source);
        z_cor= np.zeros(n_source);
      
        
        from cross_3d import cross_gradinv_3d as f
        
        
        #函数调用
        f.gm_3d_cross_gradinv(\
            z0,B,tz,tx,az,ax,cengshu,x_number,y_number,x_n_coordinate,y_n_coordinate,max_iteration,\
            zzmax,lam_g,lam_m,\
            b_low_g,b_up_g,b_low_m,b_up_m,beta,alpha,x_coordinate,y_coordinate,\
            density,magnetization,d_obs_g,d_obs_m,x_cor,y_cor,z_cor,n_source,n_coordinate)   
        
            
        
        dataframe=pd.DataFrame({'x':x_cor.ravel(),'y':y_cor.ravel(),'z':z_cor.ravel(),\
                                'den':density.ravel(),'mag':magnetization.ravel()})

        v1 = {
        'x' : list(dataframe['x'][:].ravel()),
        'y' : list(dataframe['y'][:].ravel()),
        'z' : list(dataframe['z'][:].ravel()),
        'density' : list(dataframe['den'][:].ravel()),
        'magnetization' : list(dataframe['mag'][:].ravel()),
        }    


        return jsonify(v1)    
    
    
    
class gm_data_space_correlation_2D(Resource):


    def post(self):

        '''重磁2D数据基于数据空间的相关分析联合反演
        ---
        tags:
          - 重磁2D数据基于数据空间的相关分析联合反演

        parameters:
             
        - name: z0
          in: query
          type: number
          required: flase
          default: 0.0
          description: 观测面深度
          
        - name: cengshu
          in: query
          type: number
          required: true
          default: 20
          description: 场源剖分层数

        - name: x_number
          in: query
          type: number
          required: true
          default: 40
          description: 场源X方向剖分个数
         
        - name: zzmax
          in: query
          type: number
          required: true
          default: 1000
          description: depth
          
        - name: f_name1
          in: formData
          type: file
          required: true
          description: gravity anomaly

        - name: f_name2
          in: formData
          type: file
          required: true
          description: magnetic anomaly
          
        - name: f_name3
          in: formData
          type: file
          required: true
          description: initial_gravity_model

        - name: f_name4
          in: formData
          type: file
          required: true
          description: initial_magnetic_model
          
        - name: B
          in: query
          type: number
          default: 50000
          required: true
          description: 地磁场磁感应强度
          
        - name: tz
          in: query
          type: number
          default: 90
          required: true
          description: 地磁场倾角

        - name: tx
          in: query
          type: number
          default: 0.0
          required: true
          description: 地磁场偏角

        - name: az
          in: query
          type: number
          default: 90
          required: true
          description: 源磁化倾角

        - name: ax
          in: query
          type: number
          default: 0.0
          required: true
          description: 源磁化偏角
          
        - name: b_low_g
          in: query
          type: number
          required: true
          default: 0.0
          description: 密度正定约束最小值
          
        - name: b_up_g
          in: query
          type: number
          required: true
          default: 2
          description: 密度正定约束最大值
          
        - name: b_low_m
          in: query
          type: number
          required: true
          default: 0.0
          description: 磁化强度正定约束最小值
       
        - name: b_up_m
          in: query
          type: number
          required: true
          default: 2
          description: 磁化强度正定约束最大值

        - name: beta
          in: query
          type: number
          required: true
          default: 0.1
          description: 弹性网正则化约束项参数一 (0.0——1.0)

        - name: alpha
          in: query
          type: number
          required: true
          default: 0.01
          description: 弹性网正则化约束项参数二 (0.0——1.0)

        - name: lam_g
          in: query
          type: number
          required: true
          default: 100000.0
          description: 重力相关分析约束项因子

        - name: lam_m
          in: query
          type: number
          required: true
          default: 100000.0
          description: 磁力相关分析约束项因子
                   
        - name: inner_iteration_max
          in: query
          type: number
          default: 20
          required: true
          description: 内部循环最大迭代次数
          
        - name: outer_iteration_max
          in: query
          type: number
          default: 10
          required: true
          description: 外部循环最大迭代次数

        responses:
          200:
            description: 重磁2D相关分析联合反演+重加权+模型加权+弹性网正则化
        '''
        

        #变量定义
        parser = reqparse.RequestParser(bundle_errors=True)
        parser.add_argument('z0', type=str, required=False, help='观测面深度')
        parser.add_argument('B', type=str, required=False, help='B')
        parser.add_argument('tz', type=str, required=False, help='tz')
        parser.add_argument('tx', type=str, required=False, help='tx')
        parser.add_argument('az', type=str, required=False, help='az')
        parser.add_argument('ax', type=str, required=False, help='ax')
        parser.add_argument('cengshu', type=str, required=False, help='场源剖分层数')
        parser.add_argument('x_number', type=str, required=False, help='X方向剖分个数')
        parser.add_argument('inner_iteration_max', type=str, required=False, help='内循环最大迭代次数')
        parser.add_argument('outer_iteration_max', type=str, required=False, help='外循环最大迭代次数')       
        parser.add_argument('zzmax', type=str, required=False, help='剖分深度')
        parser.add_argument('lam_g', type=str, required=False, help='相关分析重力权重')
        parser.add_argument('lam_m', type=str, required=False, help='相关分析磁力权重')
        parser.add_argument('b_low_g', type=str, required=False, help='密度正定约束下限')
        parser.add_argument('b_up_g', type=str, required=False, help='密度正定约束上限')
        parser.add_argument('b_low_m', type=str, required=False, help='磁化强度正定约束下限')
        parser.add_argument('b_up_m', type=str, required=False, help='磁化强度正定约束上限')
        parser.add_argument('beta', type=str, required=False, help='弹性网正则化约束项参数1')
        parser.add_argument('alpha', type=str, required=False, help='弹性网正则化约束项参数2')
        args = parserinfo(parser)
        
 
     
        
        #数据转换格式
        z0=float(args['z0'])
        B= float(args['B'])
        tz= float(args['tz'])
        tx= float(args['tx'])
        az= float(args['az'])
        ax= float(args['ax'])
        cengshu= int(args['cengshu'])
        x_number= int(args['x_number'])
        inner_iteration_max=  int(args['inner_iteration_max'])
        outer_iteration_max=  int(args['outer_iteration_max'])
        zzmax= float(args['zzmax'])
        lam_g= float(args['lam_g'])
        lam_m= float(args['lam_m'])
        b_low_g= float(args['b_low_g'])
        b_up_g= float(args['b_up_g'])
        b_low_m= float(args['b_low_m'])
        b_up_m= float(args['b_up_m'])
        beta = float(args['beta'])
        alpha= float(args['alpha'])
        
        
        
        #读取文件
        uploaded_file = request.files['f_name1']
        gradata = pd.read_csv(uploaded_file)
        lon=gradata['x'] 
        d_obs_g=gradata['data']
        x_coordinate= lon.values
        n_coordinate=len(x_coordinate)
               
        
        uploaded_file1 = request.files['f_name2']
        gradata1 = pd.read_csv(uploaded_file1)
        d_obs_m = gradata1['data']
          
                
        uploaded_file2 = request.files['f_name3']
        gradata2 = pd.read_csv(uploaded_file2)
        density = gradata2['data']
        n_source=int(len(density))
      
        
        uploaded_file3 = request.files['f_name4']
        gradata3 = pd.read_csv(uploaded_file3)
        magnetization=gradata3['data']
        x_cor= np.zeros(n_source);
        z_cor= np.zeros(n_source);   
        print(n_source)
        
        
        from cor_data_2d import cor_2d_data_space_inv as f0
        
        
        #函数调用
        f0.gm_2d_correlation_data_space_inv(\
            z0,B,tz,tx,az,ax,cengshu,x_number,\
            inner_iteration_max,outer_iteration_max,zzmax,lam_g,lam_m,\
            b_low_g,b_up_g,b_low_m,b_up_m,beta,alpha,x_coordinate,\
            density,magnetization,d_obs_g,d_obs_m,x_cor,z_cor,n_source,n_coordinate)                                                                         
        
        
        dataframe=pd.DataFrame({'x':x_cor.ravel(),'z':z_cor.ravel(),\
                                'den':density.ravel(),'mag':magnetization.ravel()})

        result = {
        'x' : list(dataframe['x'][:].ravel()),
        'z' : list(dataframe['z'][:].ravel()),
        'density' : list(dataframe['den'][:].ravel()),
        'magnetization' : list(dataframe['mag'][:].ravel()),
        }    

        return jsonify(result)    
    
    
    
class gm_data_space_correlation_3D(Resource):


    def post(self):

        '''重磁3D数据基于数据空间的相关分析联合反演
        ---
        tags:
          - 重磁3D数据基于数据空间的相关分析联合反演

        parameters:
        - name: z0
          in: query
          type: number
          required: flase
          default: 0.0
          description: 观测面深度
          
        - name: cengshu
          in: query
          type: number
          required: true
          default: 10
          description: 场源剖分层数

        - name: x_number
          in: query
          type: number
          required: true
          default: 20
          description: 场源X方向剖分个数
          
        - name: y_number
          in: query
          type: number
          required: true
          default: 20
          description: 场源y方向剖分个数
          
        - name: x_n_coordinate
          in: query
          type: number
          required: true
          default: 21
          description: 测网X方向的测点数
          
        - name: y_n_coordinate
          in: query
          type: number
          required: true
          default: 21
          description: 测网Y方向的测点数
          
        - name: zzmax
          in: query
          type: number
          required: true
          default: 500
          description: depth
          
        - name: f_name1
          in: formData
          type: file
          required: true
          description: gravity anomaly

        - name: f_name2
          in: formData
          type: file
          required: true
          description: magnetic anomaly
          
        - name: f_name3
          in: formData
          type: file
          required: true
          description: initial_gravity_model

        - name: f_name4
          in: formData
          type: file
          required: true
          description: initial_magnetic_model
          
        - name: B
          in: query
          type: number
          default: 50000
          required: true
          description: 地磁场磁感应强度
          
        - name: tz
          in: query
          type: number
          default: 90
          required: true
          description: 地磁场倾角

        - name: tx
          in: query
          type: number
          default: 0.0
          required: true
          description: 地磁场偏角

        - name: az
          in: query
          type: number
          default: 90
          required: true
          description: 源磁化倾角

        - name: ax
          in: query
          type: number
          default: 0.0
          required: true
          description: 源磁化偏角
          
        - name: inner_iteration_max
          in: query
          type: number
          default: 20
          required: true
          
          description: 内部循环最大迭代次数
          
        - name: outer_iteration_max
          in: query
          type: number
          default: 10
          required: true
          description: 外部循环最大迭代次数
          
        - name: b_low_g
          in: query
          type: number
          required: true
          default: 0.0
          description: 密度正定约束最小值
          
        - name: b_up_g
          in: query
          type: number
          required: true
          default: 2
          description: 密度正定约束最大值
          
        - name: b_low_m
          in: query
          type: number
          required: true
          default: 0.0
          description: 磁化强度正定约束最小值
       
        - name: b_up_m
          in: query
          type: number
          required: true
          default: 2
          description: 磁化强度正定约束最大值

        - name: beta
          in: query
          type: number
          required: true
          default: 0.1
          description: 弹性网正则化约束项参数一 (0.0——1.0)

        - name: alpha
          in: query
          type: number
          required: true
          default: 0.01
          description: 弹性网正则化约束项参数二 (0.0——1.0)

        - name: lam_g
          in: query
          type: number
          required: true
          default: 0.1
          description: 重力相关分析约束项因子

        - name: lam_m
          in: query
          type: number
          required: true
          default: 0.1
          description: 磁力相关分析约束项因子

        responses:
          200:
            description: 重磁3D相关分析联合反演+重加权+模型加权+弹性网正则化
        '''
        

        #变量定义
        parser = reqparse.RequestParser(bundle_errors=True)
        parser.add_argument('z0', type=str, required=False, help='观测面深度')
        parser.add_argument('B', type=str, required=False, help='B')
        parser.add_argument('tz', type=str, required=False, help='tz')
        parser.add_argument('tx', type=str, required=False, help='tx')
        parser.add_argument('az', type=str, required=False, help='az')
        parser.add_argument('ax', type=str, required=False, help='ax')
        parser.add_argument('cengshu', type=str, required=False, help='场源剖分层数')
        parser.add_argument('x_number', type=str, required=False, help='X方向剖分个数')
        parser.add_argument('y_number', type=str, required=False, help='y方向剖分个数')
        parser.add_argument('x_n_coordinate', type=str, required=False, help='X方向测点个数')
        parser.add_argument('y_n_coordinate', type=str, required=False, help='y方向测点个数')
        parser.add_argument('zzmax', type=str, required=False, help='剖分深度')
        parser.add_argument('lam_g', type=str, required=False, help='交叉梯度重力权重')
        parser.add_argument('lam_m', type=str, required=False, help='交叉梯度磁力权重')
        parser.add_argument('b_low_g', type=str, required=False, help='密度正定约束下限')
        parser.add_argument('b_up_g', type=str, required=False, help='密度正定约束上限')
        parser.add_argument('b_low_m', type=str, required=False, help='磁化强度正定约束下限')
        parser.add_argument('b_up_m', type=str, required=False, help='磁化强度正定约束上限')
        parser.add_argument('beta', type=str, required=False, help='弹性网正则化约束项参数1')
        parser.add_argument('alpha', type=str, required=False, help='弹性网正则化约束项参数2')
        parser.add_argument('inner_iteration_max', type=str, required=False, help='内循环最大迭代次数')
        parser.add_argument('outer_iteration_max', type=str, required=False, help='外循环最大迭代次数')       
        args = parserinfo(parser)
        
        

        #数据转换格式
        z0=float(args['z0'])
        B= float(args['B'])
        tz= float(args['tz'])
        tx= float(args['tx'])
        az= float(args['az'])
        ax= float(args['ax'])
        cengshu= int(args['cengshu'])
        x_number= int(args['x_number'])
        y_number= int(args['y_number'])
        x_n_coordinate= int(args['x_n_coordinate'])
        y_n_coordinate= int(args['y_n_coordinate'])
        zzmax= float(args['zzmax'])
        lam_g= float(args['lam_g'])
        lam_m= float(args['lam_m'])
        b_low_g= float(args['b_low_g'])
        b_up_g= float(args['b_up_g'])
        b_low_m= float(args['b_low_m'])
        b_up_m= float(args['b_up_m'])
        beta = float(args['beta'])
        alpha= float(args['alpha'])
        inner_iteration_max=  int(args['inner_iteration_max'])
        outer_iteration_max=  int(args['outer_iteration_max'])



        #读取文件
        uploaded_file = request.files['f_name1']
        gradata = pd.read_csv(uploaded_file)
        lon=gradata['x'] 
        lat=gradata['y'] 
        d_obs_g=gradata['data']
        x_coordinate= lon.values
        y_coordinate= lat.values
        n_coordinate=int(len(x_coordinate))
      
        
        uploaded_file1 = request.files['f_name2']
        gradata1 = pd.read_csv(uploaded_file1)
        d_obs_m=gradata1['data']
    
        
        uploaded_file2 = request.files['f_name3']
        gradata2 = pd.read_csv(uploaded_file2)
        density= gradata2['data']
        n_source=int(len(density))
        
        
        uploaded_file3 = request.files['f_name4']
        gradata3 = pd.read_csv(uploaded_file3)
        magnetization= gradata3['data']
                
        
        x_cor= np.zeros(n_source);
        y_cor= np.zeros(n_source);
        z_cor= np.zeros(n_source);
      
        
        from cor_data_3d import cor_3d_data_space_inv as f
        
        
        #函数调用
        f.gm_3d_correlation_data_space_inv(\
            z0,B,tz,tx,az,ax,cengshu,x_number,y_number,x_n_coordinate,y_n_coordinate,\
            inner_iteration_max,outer_iteration_max,\
            zzmax,lam_g,lam_m,\
            b_low_g,b_up_g,b_low_m,b_up_m,beta,alpha,x_coordinate,y_coordinate,\
            density,magnetization,d_obs_g,d_obs_m,x_cor,y_cor,z_cor,n_source,n_coordinate)   
        
            
        
        dataframe=pd.DataFrame({'x':x_cor.ravel(),'y':y_cor.ravel(),'z':z_cor.ravel(),\
                                'den':density.ravel(),'mag':magnetization.ravel()})

        v1 = {
        'x' : list(dataframe['x'][:].ravel()),
        'y' : list(dataframe['y'][:].ravel()),
        'z' : list(dataframe['z'][:].ravel()),
        'density' : list(dataframe['den'][:].ravel()),
        'magnetization' : list(dataframe['mag'][:].ravel()),
        }    


        return jsonify(v1)        
    
    
    
class gm_correlation_2D(Resource):


    def post(self):

        '''重磁2D数据相关分析联合反演
        ---
        tags:
          - 重磁2D数据相关分析联合反演

        parameters:
        - name: z0
          in: query
          type: number
          required: flase
          default: 0.0
          description: 观测面深度
          
        - name: cengshu
          in: query
          type: number
          required: true
          default: 20
          description: 场源剖分层数

        - name: x_number
          in: query
          type: number
          required: true
          default: 40
          description: 场源X方向剖分个数
         
        - name: zzmax
          in: query
          type: number
          required: true
          default: 1000
          description: depth
          
        - name: f_name1
          in: formData
          type: file
          required: true
          description: gravity anomaly

        - name: f_name2
          in: formData
          type: file
          required: true
          description: magnetic anomaly
          
        - name: f_name3
          in: formData
          type: file
          required: true
          description: initial_gravity_model

        - name: f_name4
          in: formData
          type: file
          required: true
          description: initial_magnetic_model
          
        - name: B
          in: query
          type: number
          default: 50000
          required: true
          description: 地磁场磁感应强度
          
        - name: tz
          in: query
          type: number
          default: 90
          required: true
          description: 地磁场倾角

        - name: tx
          in: query
          type: number
          default: 0.0
          required: true
          description: 地磁场偏角

        - name: az
          in: query
          type: number
          default: 90
          required: true
          description: 源磁化倾角

        - name: ax
          in: query
          type: number
          default: 0.0
          required: true
          description: 源磁化偏角
          
        - name: max_iteration
          in: query
          type: number
          default: 100
          required: true
          description: 最大迭代次数

        - name: b_low_g
          in: query
          type: number
          required: true
          default: 0.0
          description: 密度正定约束最小值
          
        - name: b_up_g
          in: query
          type: number
          required: true
          default: 2
          description: 密度正定约束最大值
          
        - name: b_low_m
          in: query
          type: number
          required: true
          default: 0.0
          description: 磁化强度正定约束最小值
       
        - name: b_up_m
          in: query
          type: number
          required: true
          default: 2
          description: 磁化强度正定约束最大值

        - name: beta
          in: query
          type: number
          required: true
          default: 0.1
          description: 弹性网正则化约束项参数一 (0.0——1.0)

        - name: alpha
          in: query
          type: number
          required: true
          default: 0.01
          description: 弹性网正则化约束项参数二 (0.0——1.0)

        - name: lam_g
          in: query
          type: number
          required: true
          default: 0.01
          description: 重力相关分析约束项因子

        - name: lam_m
          in: query
          type: number
          required: true
          default: 0.01
          description: 磁力相关分析约束项因子

        responses:
          200:
            description: 重磁2D相关分析联合反演+重加权+模型加权+弹性网正则化
        '''
        

        #变量定义
        parser = reqparse.RequestParser(bundle_errors=True)
        parser.add_argument('z0', type=str, required=False, help='观测面深度')
        parser.add_argument('B', type=str, required=False, help='B')
        parser.add_argument('tz', type=str, required=False, help='tz')
        parser.add_argument('tx', type=str, required=False, help='tx')
        parser.add_argument('az', type=str, required=False, help='az')
        parser.add_argument('ax', type=str, required=False, help='ax')
        parser.add_argument('cengshu', type=str, required=False, help='场源剖分层数')
        parser.add_argument('x_number', type=str, required=False, help='X方向剖分个数')
        parser.add_argument('zzmax', type=str, required=False, help='剖分深度')
        parser.add_argument('lam_g', type=str, required=False, help='相关分析重力权重')
        parser.add_argument('lam_m', type=str, required=False, help='相关分析磁力权重')
        parser.add_argument('b_low_g', type=str, required=False, help='密度正定约束下限')
        parser.add_argument('b_up_g', type=str, required=False, help='密度正定约束上限')
        parser.add_argument('b_low_m', type=str, required=False, help='磁化强度正定约束下限')
        parser.add_argument('b_up_m', type=str, required=False, help='磁化强度正定约束上限')
        parser.add_argument('beta', type=str, required=False, help='弹性网正则化约束项参数1')
        parser.add_argument('alpha', type=str, required=False, help='弹性网正则化约束项参数2')
        parser.add_argument('max_iteration', type=str, required=False, help='最大迭代次数')
        args = parserinfo(parser)
 

        #数据转换格式
        z0=float(args['z0'])
        B= float(args['B'])
        tz= float(args['tz'])
        tx= float(args['tx'])
        az= float(args['az'])
        ax= float(args['ax'])
        cengshu= int(args['cengshu'])
        x_number= int(args['x_number'])
        zzmax= float(args['zzmax'])
        lam_g= float(args['lam_g'])
        lam_m= float(args['lam_m'])
        b_low_g= float(args['b_low_g'])
        b_up_g= float(args['b_up_g'])
        b_low_m= float(args['b_low_m'])
        b_up_m= float(args['b_up_m'])
        beta = float(args['beta'])
        alpha= float(args['alpha'])
        max_iteration=  int(args['max_iteration'])
       

        #读取文件
        uploaded_file = request.files['f_name1']
        gradata = pd.read_csv(uploaded_file)
        lon=gradata['x'] 
        d_obs_g=gradata['data']
        x_coordinate= lon.values
        n_coordinate=int(len(x_coordinate))
        
        
        uploaded_file1 = request.files['f_name2']
        gradata1 = pd.read_csv(uploaded_file1)
        d_obs_m = gradata1['data']
               
        
        uploaded_file2 = request.files['f_name3']
        gradata2 = pd.read_csv(uploaded_file2)
        density = gradata2['data']
        n_source=int(len(density))
        
        
        uploaded_file3 = request.files['f_name4']
        gradata3 = pd.read_csv(uploaded_file3)
        magnetization=gradata3['data']
        x_cor= np.zeros(n_source);
        z_cor= np.zeros(n_source);
        print('0')
        
        
        from cor_2d import correlation_2d_gradinv as f
        print('run')


        #函数调用
        f.gm_2d_correlation_inv(\
            z0,B,tz,tx,az,ax,cengshu,x_number,\
            max_iteration,zzmax,lam_g,lam_m,\
            b_low_g,b_up_g,b_low_m,b_up_m,beta,alpha,x_coordinate,\
            density,magnetization,d_obs_g,d_obs_m,x_cor,z_cor,n_source,n_coordinate)                                                                         
        
            
        dataframe=pd.DataFrame({'x':x_cor.ravel(),'z':z_cor.ravel(),\
                                'den':density.ravel(),'mag':magnetization.ravel()})

        v1 = {
        'x' : list(dataframe['x'][:].ravel()),
        'z' : list(dataframe['z'][:].ravel()),
        'density' : list(dataframe['den'][:].ravel()),
        'magnetization' : list(dataframe['mag'][:].ravel()),
        }    


        return jsonify(v1)    
    
    
    
class gm_correlation_3D(Resource):


    def post(self):

        '''重磁3D数据相关分析联合反演
        ---
        tags:
          - 重磁3D数据相关分析联合反演

        parameters:
        - name: z0
          in: query
          type: number
          required: flase
          default: 0.0
          description: 观测面深度
          
        - name: cengshu
          in: query
          type: number
          required: true
          default: 10
          description: 场源剖分层数

        - name: x_number
          in: query
          type: number
          required: true
          default: 20
          description: 场源X方向剖分个数
          
        - name: y_number
          in: query
          type: number
          required: true
          default: 20
          description: 场源y方向剖分个数
          
        - name: x_n_coordinate
          in: query
          type: number
          required: true
          default: 21
          description: 测网X方向的测点数
          
        - name: y_n_coordinate
          in: query
          type: number
          required: true
          default: 21
          description: 测网Y方向的测点数
          
        - name: zzmax
          in: query
          type: number
          required: true
          default: 500
          description: depth
          
        - name: f_name1
          in: formData
          type: file
          required: true
          description: gravity anomaly

        - name: f_name2
          in: formData
          type: file
          required: true
          description: magnetic anomaly
          
        - name: f_name3
          in: formData
          type: file
          required: true
          description: initial_gravity_model

        - name: f_name4
          in: formData
          type: file
          required: true
          description: initial_magnetic_model
          
        - name: B
          in: query
          type: number
          default: 50000
          required: true
          description: 地磁场磁感应强度
          
        - name: tz
          in: query
          type: number
          default: 90
          required: true
          description: 地磁场倾角

        - name: tx
          in: query
          type: number
          default: 0.0
          required: true
          description: 地磁场偏角

        - name: az
          in: query
          type: number
          default: 90
          required: true
          description: 源磁化倾角

        - name: ax
          in: query
          type: number
          default: 0.0
          required: true
          description: 源磁化偏角
          
        - name: max_iteration
          in: query
          type: number
          default: 100
          required: true
          description: 最大迭代次数

        - name: b_low_g
          in: query
          type: number
          required: true
          default: 0.0
          description: 密度正定约束最小值
          
        - name: b_up_g
          in: query
          type: number
          required: true
          default: 2
          description: 密度正定约束最大值
          
        - name: b_low_m
          in: query
          type: number
          required: true
          default: 0.0
          description: 磁化强度正定约束最小值
       
        - name: b_up_m
          in: query
          type: number
          required: true
          default: 2
          description: 磁化强度正定约束最大值

        - name: beta
          in: query
          type: number
          required: true
          default: 0.1
          description: 弹性网正则化约束项参数一 (0.0——1.0)

        - name: alpha
          in: query
          type: number
          required: true
          default: 0.01
          description: 弹性网正则化约束项参数二 (0.0——1.0)

        - name: lam_g
          in: query
          type: number
          required: true
          default: 0.0001
          description: 重力相关分析约束项因子

        - name: lam_m
          in: query
          type: number
          required: true
          default: 0.0001
          description: 磁力相关分析约束项因子

        responses:
          200:
            description: 重磁3D相关分析联合反演+重加权+模型加权+弹性网正则化
        '''
        

        #变量定义
        parser = reqparse.RequestParser(bundle_errors=True)
        parser.add_argument('z0', type=str, required=False, help='观测面深度')
        parser.add_argument('B', type=str, required=False, help='B')
        parser.add_argument('tz', type=str, required=False, help='tz')
        parser.add_argument('tx', type=str, required=False, help='tx')
        parser.add_argument('az', type=str, required=False, help='az')
        parser.add_argument('ax', type=str, required=False, help='ax')
        parser.add_argument('cengshu', type=str, required=False, help='场源剖分层数')
        parser.add_argument('x_number', type=str, required=False, help='X方向剖分个数')
        parser.add_argument('y_number', type=str, required=False, help='y方向剖分个数')
        parser.add_argument('x_n_coordinate', type=str, required=False, help='X方向测点个数')
        parser.add_argument('y_n_coordinate', type=str, required=False, help='y方向测点个数')
        parser.add_argument('zzmax', type=str, required=False, help='剖分深度')
        parser.add_argument('lam_g', type=str, required=False, help='相关分析重力权重')
        parser.add_argument('lam_m', type=str, required=False, help='相关分析磁力权重')
        parser.add_argument('b_low_g', type=str, required=False, help='密度正定约束下限')
        parser.add_argument('b_up_g', type=str, required=False, help='密度正定约束上限')
        parser.add_argument('b_low_m', type=str, required=False, help='磁化强度正定约束下限')
        parser.add_argument('b_up_m', type=str, required=False, help='磁化强度正定约束上限')
        parser.add_argument('beta', type=str, required=False, help='弹性网正则化约束项参数1')
        parser.add_argument('alpha', type=str, required=False, help='弹性网正则化约束项参数2')
        parser.add_argument('max_iteration', type=str, required=False, help='最大迭代次数')
        args = parserinfo(parser)
        
        

        #数据转换格式
        z0=float(args['z0'])
        B= float(args['B'])
        tz= float(args['tz'])
        tx= float(args['tx'])
        az= float(args['az'])
        ax= float(args['ax'])
        cengshu= int(args['cengshu'])
        x_number= int(args['x_number'])
        y_number= int(args['y_number'])
        x_n_coordinate= int(args['x_n_coordinate'])
        y_n_coordinate= int(args['y_n_coordinate'])
        zzmax= float(args['zzmax'])
        lam_g= float(args['lam_g'])
        lam_m= float(args['lam_m'])
        b_low_g= float(args['b_low_g'])
        b_up_g= float(args['b_up_g'])
        b_low_m= float(args['b_low_m'])
        b_up_m= float(args['b_up_m'])
        beta = float(args['beta'])
        alpha= float(args['alpha'])
        max_iteration=  int(args['max_iteration'])


        #读取文件
        uploaded_file = request.files['f_name1']
        gradata = pd.read_csv(uploaded_file)
        lon=gradata['x'] 
        lat=gradata['y'] 
        d_obs_g=gradata['data']
        x_coordinate= lon.values
        y_coordinate= lat.values
        n_coordinate=int(len(x_coordinate))
      
        
        uploaded_file1 = request.files['f_name2']
        gradata1 = pd.read_csv(uploaded_file1)
        d_obs_m=gradata1['data']
    
        
        uploaded_file2 = request.files['f_name3']
        gradata2 = pd.read_csv(uploaded_file2)
        density= gradata2['data']
        n_source=int(len(density))
        
        
        uploaded_file3 = request.files['f_name4']
        gradata3 = pd.read_csv(uploaded_file3)
        magnetization= gradata3['data']
                
        
        x_cor= np.zeros(n_source);
        y_cor= np.zeros(n_source);
        z_cor= np.zeros(n_source);
      
        
        
        from cor_3d import correlation_3d_gradinv as f
        
        
        #函数调用
        f.gm_3d_correlation_inv(\
            z0,B,tz,tx,az,ax,cengshu,x_number,y_number,\
            x_n_coordinate,y_n_coordinate,max_iteration,\
            zzmax,lam_g,lam_m,\
            b_low_g,b_up_g,b_low_m,b_up_m,beta,alpha,x_coordinate,y_coordinate,\
            density,magnetization,d_obs_g,d_obs_m,x_cor,y_cor,z_cor,n_source,n_coordinate)   
        
                    
        
        dataframe=pd.DataFrame({'x':x_cor.ravel(),'y':y_cor.ravel(),'z':z_cor.ravel(),\
                                'den':density.ravel(),'mag':magnetization.ravel()})

        v1 = {
        'x' : list(dataframe['x'][:].ravel()),
        'y' : list(dataframe['y'][:].ravel()),
        'z' : list(dataframe['z'][:].ravel()),
        'density' : list(dataframe['den'][:].ravel()),
        'magnetization' : list(dataframe['mag'][:].ravel()),
        }    


        return jsonify(v1)       
    

class fcrm_2D(Resource):


    def post(self):

        '''重磁2D数据模糊c回归聚类联合反演
        ---
        tags:
          - 重磁2D数据模糊c回归聚类联合反演

        parameters:
            
        - name: z0
          in: query
          type: number
          required: flase
          default: 0.0
          description: 观测面深度
          
        - name: cengshu
          in: query
          type: number
          required: true
          default: 100
          description: 场源剖分层数

        - name: x_number
          in: query
          type: number
          required: true
          default: 120
          description: 场源X方向剖分个数(x_number).
          
        - name: zzmax
          in: query
          type: number
          required: true
          default: 10000
          description: depth
          
        - name: f_name1
          in: formData
          type: file
          required: true
          description: gravity anomaly

        - name: f_name2
          in: formData
          type: file
          required: true
          description: magnetic anomaly
          
        - name: f_name3
          in: formData
          type: file
          required: true
          description: initial_gravity_model

        - name: f_name4
          in: formData
          type: file
          required: true
          description: initial_magnetic_model
          
        - name: B
          in: query
          type: number
          default: 50000
          required: true
          description: 地磁场磁感应强度
          
        - name: tz
          in: query
          type: number
          default: 90
          required: true
          description: 地磁场倾角

        - name: tx
          in: query
          type: number
          default: 0.0
          required: true
          description: 地磁场偏角

        - name: az
          in: query
          type: number
          default: 90
          required: true
          description: 源磁化倾角

        - name: ax
          in: query
          type: number
          default: 0.0
          required: true
          description: 源磁化偏角
          
        - name: max_iteration
          in: query
          type: number
          default: 100
          required: true
          description: 最大迭代次数

        - name: b_low_g
          in: query
          type: number
          required: true
          default: 0.0
          description: 密度正定约束最小值
          
        - name: b_up_g
          in: query
          type: number
          required: true
          default: 2.5
          description: 密度正定约束最大值
          
        - name: b_low_m
          in: query
          type: number
          required: true
          default: 0.0
          description: 磁化强度正定约束最小值
       
        - name: b_up_m
          in: query
          type: number
          required: true
          default: 2.5
          description: 磁化强度正定约束最大值

          
        - name: lam_g
          in: query
          type: number
          required: true
          default: 10000000.0
          description: 重力模糊聚类权重因子一    
          
        - name: lam_m
          in: query
          type: number
          required: true
          default: 10000000.0
          description: 磁力模糊聚类权重因子一  
          
        - name: eta_g
          in: query
          type: number
          required: true
          default: 5.0
          description: 引导约束项权重因子一

        - name: eta_m
          in: query
          type: number
          required: true
          default: 5.0
          description: 引导约束项权重因子二
          
        - name: C
          in: query
          type: number
          required: true
          default: 2
          description: 模糊聚类类别数

        - name: vk
          in: query
          type: string
          default: 0.7,-0.3,0.4,0.0
          required: true
          description: 初始聚类中心(vjk((k=1,2,1),j=1,C,1)).例：[0.05,0.05,1.0,1.0]
         
        - name: tk
          in: query
          type: string
          collectionFormat: csv
          default: 0.86,0.0,1.5,-1.0
          required: true
          description: 目标聚类中心(tk((k=1,2,1),j=1,C,1)).例：[0.0,0.0,2.0,2.0]


        responses:
          200:
            description: 重磁2D模糊聚类联合反演
        '''
        
        

        #变量定义
        parser = reqparse.RequestParser(bundle_errors=True)
        parser.add_argument('z0', type=str, required=False, help='观测面深度')
        parser.add_argument('B', type=str, required=False, help='B')
        parser.add_argument('tz', type=str, required=False, help='tz')
        parser.add_argument('tx', type=str, required=False, help='tx')
        parser.add_argument('az', type=str, required=False, help='az')
        parser.add_argument('ax', type=str, required=False, help='ax')
        parser.add_argument('cengshu', type=str, required=False, help='场源剖分层数')
        parser.add_argument('x_number', type=str, required=False, help='X方向剖分个数')
        parser.add_argument('zzmax', type=str, required=False, help='剖分深度')
        parser.add_argument('b_low_g', type=str, required=False, help='密度正定约束下限')
        parser.add_argument('b_up_g', type=str, required=False, help='密度正定约束上限')
        parser.add_argument('b_low_m', type=str, required=False, help='磁化强度正定约束下限')
        parser.add_argument('b_up_m', type=str, required=False, help='磁化强度正定约束上限')
        parser.add_argument('max_iteration', type=str, required=False, help='最大迭代次数')
        parser.add_argument('C', type=str, required=False, help='聚类类别数')
        parser.add_argument('lam_g', type=str, required=False, help='模糊聚类重力权重')
        parser.add_argument('lam_m', type=str, required=False, help='模糊聚类磁力权重')
        parser.add_argument('eta_g', type=str, required=False, help='引导项重力权重因子')
        parser.add_argument('eta_m', type=str, required=False, help='引导项磁力权重因子')
        parser.add_argument('vk', type=str, required=False, help='初始聚类中心')
        parser.add_argument('tk', type=str, required=False, help='目标聚类中心')
        args = parserinfo(parser)
                
        
       
        #数据转换格式
        z0=float(args['z0'])
        B= float(args['B'])
        tz= float(args['tz'])
        tx= float(args['tx'])
        az= float(args['az'])
        ax= float(args['ax'])
        cengshu= int(args['cengshu'])
        x_number= int(args['x_number'])
        zzmax= float(args['zzmax'])
        b_low_g= float(args['b_low_g'])
        b_up_g= float(args['b_up_g'])
        b_low_m= float(args['b_low_m'])
        b_up_m= float(args['b_up_m'])
        max_iteration=  int(args['max_iteration'])
        C=  int(args['C'])
        lam_g= float(args['lam_g'])
        lam_m= float(args['lam_m'])
        eta_g= float(args['eta_g'])
        eta_m= float(args['eta_m'])


        vk = np.array(args['vk'].split(','))
        vk = [float(i) for i in vk]
        
        # rv = []
        # for y in range(C):
        #    for x in range(0, 2):
        #       if x == 0:
        #          rv.append([])
        #       rv[y].append(vk[x + y * 2])
                 
        # print(rv)
        
        
        tk = np.array(args['tk'].split(','))
        tk = [float(i) for i in tk]
        
        # rt = []
        # for y in range(C):
        #    for x in range(0, 2):
        #       if x == 0:
        #          rt.append([])
        #       rt[y].append(tk[x + y * 2])
                 
        # print(rt)
        

        #读取文件
        uploaded_file = request.files['f_name1']
        gradata = pd.read_csv(uploaded_file)
        lon=gradata['x'] 
        d_obs_g=gradata['data']
        x_coordinate= lon.values
        n_coordinate=int(len(x_coordinate))
        print(1)  
        
        uploaded_file1 = request.files['f_name2']
        gradata1 = pd.read_csv(uploaded_file1)
        d_obs_m=gradata1['data']
        
        
        uploaded_file2 = request.files['f_name3']
        gradata2 = pd.read_csv(uploaded_file2)
        density= gradata2['data']
        n_source=int(len(density))
        # print(mref_g)
        
        
        uploaded_file3 = request.files['f_name4']
        gradata3 = pd.read_csv(uploaded_file3)
        magnetization= gradata3['data']
        # print(mref_m)        
        
        
        x_cor= np.zeros(n_source);
        z_cor= np.zeros(n_source);
        
        
        mref_g= np.zeros(n_source);
        mref_m= np.zeros(n_source);
        
        
        from fcrm_2d import fcrm_2d_gminv as f
        
        
        #函数调用
        f.fcrm_2d_inversion(\
            z0,B,tz,tx,az,ax,cengshu,x_number,max_iteration,\
            zzmax,b_low_g,b_up_g,b_low_m,b_up_m,\
            x_coordinate,density,magnetization,mref_g,mref_m,d_obs_g,d_obs_m,x_cor,z_cor,\
            lam_g,lam_m,eta_g,eta_m,vk,tk,C,n_source,n_coordinate)   
        
   
            
        dataframe=pd.DataFrame({'x':x_cor.ravel(),'z':z_cor.ravel(),\
                                'den':density.ravel(),'mag':magnetization.ravel()})

        v1 = {
        'x' : list(dataframe['x'][:].ravel()),
        'z' : list(dataframe['z'][:].ravel()),
        'density' : list(dataframe['den'][:].ravel()),
        'magnetization' : list(dataframe['mag'][:].ravel()),
        }    


        return jsonify(v1)  
    
    
    
class fcrm_3D(Resource):


    def post(self):

        '''重磁3D数据模糊c回归聚类联合反演
        ---
        tags:
          - 重磁3D数据模糊c回归聚类联合反演

        parameters:
            
        - name: z0
          in: query
          type: number
          required: flase
          default: 0.0
          description: 观测面深度
          
        - name: cengshu
          in: query
          type: number
          required: true
          default: 40
          description: 场源剖分层数

        - name: x_number
          in: query
          type: number
          required: true
          default: 60
          description: 场源X方向剖分个数(x_number).
          
        - name: y_number
          in: query
          type: number
          required: true
          default: 5
          description: 场源Y方向剖分个数(y_number).
          
        - name: x_n_coordinate
          in: query
          type: number
          required: true
          default: 61
          description: 测网X方向的测点数
          
        - name: y_n_coordinate
          in: query
          type: number
          required: true
          default: 6
          description: 测网Y方向的测点数
          
        - name: zzmax
          in: query
          type: number
          required: true
          default: 4000
          description: depth
          
        - name: f_name1
          in: formData
          type: file
          required: true
          description: gravity anomaly

        - name: f_name2
          in: formData
          type: file
          required: true
          description: magnetic anomaly
          
        - name: f_name3
          in: formData
          type: file
          required: true
          description: initial_gravity_model

        - name: f_name4
          in: formData
          type: file
          required: true
          description: initial_magnetic_model
          
        - name: B
          in: query
          type: number
          default: 50000
          required: true
          description: 地磁场磁感应强度
          
        - name: tz
          in: query
          type: number
          default: 90
          required: true
          description: 地磁场倾角

        - name: tx
          in: query
          type: number
          default: 0.0
          required: true
          description: 地磁场偏角

        - name: az
          in: query
          type: number
          default: 90
          required: true
          description: 源磁化倾角

        - name: ax
          in: query
          type: number
          default: 0.0
          required: true
          description: 源磁化偏角
          
        - name: max_iteration
          in: query
          type: number
          default: 100
          required: true
          description: 最大迭代次数

        - name: b_low_g
          in: query
          type: number
          required: true
          default: 0.0
          description: 密度正定约束最小值
          
        - name: b_up_g
          in: query
          type: number
          required: true
          default: 2.5
          description: 密度正定约束最大值
          
        - name: b_low_m
          in: query
          type: number
          required: true
          default: 0.0
          description: 磁化强度正定约束最小值
       
        - name: b_up_m
          in: query
          type: number
          required: true
          default: 2.5
          description: 磁化强度正定约束最大值
          
        - name: lam_g
          in: query
          type: number
          required: true
          default: 10000000.0
          description: 重力模糊聚类权重因子一    
          
        - name: lam_m
          in: query
          type: number
          required: true
          default: 10000000.0
          description: 磁力模糊聚类权重因子一  
          
        - name: eta_g
          in: query
          type: number
          required: true
          default: 5.0
          description: 引导约束项权重因子一

        - name: eta_m
          in: query
          type: number
          required: true
          default: 5.0
          description: 引导约束项权重因子二
          
        - name: C
          in: query
          type: number
          required: true
          default: 2
          description: 模糊聚类类别数

        - name: vk
          in: query
          type: string
          default: 0.9,0.0,0.9,0.0
          required: true
          description: 初始聚类中心(vjk((k=1,2,1),j=1,C,1)).例：[0.05,0.05,1.0,1.0]
         
        - name: tk
          in: query
          type: string
          collectionFormat: csv
          default: 0.86,0.0,1.5,-1.0
          required: true
          description: 目标聚类中心(tk((k=1,2,1),j=1,C,1)).例：[0.0,0.0,2.0,2.0]


        responses:
          200:
            description: 重磁3D数据模糊c回归聚类联合反演
        '''
        
        

        #变量定义
        parser = reqparse.RequestParser(bundle_errors=True)
        parser.add_argument('z0', type=str, required=False, help='观测面深度')
        parser.add_argument('B', type=str, required=False, help='B')
        parser.add_argument('tz', type=str, required=False, help='tz')
        parser.add_argument('tx', type=str, required=False, help='tx')
        parser.add_argument('az', type=str, required=False, help='az')
        parser.add_argument('ax', type=str, required=False, help='ax')
        parser.add_argument('cengshu', type=str, required=False, help='场源剖分层数')
        parser.add_argument('x_number', type=str, required=False, help='X方向剖分个数')
        parser.add_argument('y_number', type=str, required=False, help='Y方向剖分个数')
        parser.add_argument('x_n_coordinate', type=str, required=False, help='X方向测点个数')
        parser.add_argument('y_n_coordinate', type=str, required=False, help='y方向测点个数')
        parser.add_argument('zzmax', type=str, required=False, help='剖分深度')
        parser.add_argument('b_low_g', type=str, required=False, help='密度正定约束下限')
        parser.add_argument('b_up_g', type=str, required=False, help='密度正定约束上限')
        parser.add_argument('b_low_m', type=str, required=False, help='磁化强度正定约束下限')
        parser.add_argument('b_up_m', type=str, required=False, help='磁化强度正定约束上限')
        parser.add_argument('max_iteration', type=str, required=False, help='最大迭代次数')
        parser.add_argument('C', type=str, required=False, help='聚类类别数')
        parser.add_argument('lam_g', type=str, required=False, help='模糊聚类重力权重')
        parser.add_argument('lam_m', type=str, required=False, help='模糊聚类磁力权重')
        parser.add_argument('eta_g', type=str, required=False, help='引导项重力权重因子')
        parser.add_argument('eta_m', type=str, required=False, help='引导项磁力权重因子')
        parser.add_argument('vk', type=str, required=False, help='初始聚类中心')
        parser.add_argument('tk', type=str, required=False, help='目标聚类中心')
        args = parserinfo(parser)
                
        
       
        #数据转换格式
        z0=float(args['z0'])
        B= float(args['B'])
        tz= float(args['tz'])
        tx= float(args['tx'])
        az= float(args['az'])
        ax= float(args['ax'])
        cengshu= int(args['cengshu'])
        x_number= int(args['x_number'])
        y_number= int(args['y_number'])
        x_n_coordinate= int(args['x_n_coordinate'])
        y_n_coordinate= int(args['y_n_coordinate'])
        zzmax= float(args['zzmax'])
        b_low_g= float(args['b_low_g'])
        b_up_g= float(args['b_up_g'])
        b_low_m= float(args['b_low_m'])
        b_up_m= float(args['b_up_m'])
        max_iteration=  int(args['max_iteration'])
        C=  int(args['C'])
        lam_g= float(args['lam_g'])
        lam_m= float(args['lam_m'])
        eta_g= float(args['eta_g'])
        eta_m= float(args['eta_m'])


        vk = np.array(args['vk'].split(','))
        vk = [float(i) for i in vk]
        
        # rv = []
        # for y in range(C):
        #    for x in range(0, 2):
        #       if x == 0:
        #          rv.append([])
        #       rv[y].append(vk[x + y * 2])
                 
        # print(rv)
        
        
        tk = np.array(args['tk'].split(','))
        tk = [float(i) for i in tk]
        
        # rt = []
        # for y in range(C):
        #    for x in range(0, 2):
        #       if x == 0:
        #          rt.append([])
        #       rt[y].append(tk[x + y * 2])
                 
        # print(rt)
        

        #读取文件
        uploaded_file = request.files['f_name1']
        gradata = pd.read_csv(uploaded_file)
        lon=gradata['x'] 
        lat=gradata['y'] 
        d_obs_g=gradata['data']
        x_coordinate= lon.values
        y_coordinate= lat.values
        n_coordinate=int(len(x_coordinate))
      
        
        uploaded_file1 = request.files['f_name2']
        gradata1 = pd.read_csv(uploaded_file1)
        d_obs_m=gradata1['data']
    
        
        uploaded_file2 = request.files['f_name3']
        gradata2 = pd.read_csv(uploaded_file2)
        density= gradata2['data']
        n_source=int(len(density))
        # print(mref_g)
        
        
        uploaded_file3 = request.files['f_name4']
        gradata3 = pd.read_csv(uploaded_file3)
        magnetization= gradata3['data']
        #print(mref_m)        
        
        
        x_cor= np.zeros(n_source);
        y_cor= np.zeros(n_source);
        z_cor= np.zeros(n_source);
        
        
        mref_g= np.zeros(n_source);
        mref_m= np.zeros(n_source);  
        
        
        from fcrm_3d import fcrm_3d_gminv as f
        
                    
                    
        #函数调用
        f.fcrm_3d_inversion(\
            z0,B,tz,tx,az,ax,cengshu,x_number,y_number,max_iteration,\
            zzmax,b_low_g,b_up_g,b_low_m,b_up_m,\
            x_n_coordinate,y_n_coordinate,\
            x_coordinate,y_coordinate,density,magnetization,mref_g,mref_m,\
            d_obs_g,d_obs_m,x_cor,y_cor,z_cor,\
            lam_g,lam_m,eta_g,eta_m,vk,tk,C,n_source,n_coordinate)   
        
        

        dataframe=pd.DataFrame({'x':x_cor.ravel(),'y':y_cor.ravel(),'z':z_cor.ravel(),\
                                'den':density.ravel(),'mag':magnetization.ravel()})

        v1 = {
        'x' : list(dataframe['x'][:].ravel()),
        'y' : list(dataframe['y'][:].ravel()),
        'z' : list(dataframe['z'][:].ravel()),
        'density' : list(dataframe['den'][:].ravel()),
        'magnetization' : list(dataframe['mag'][:].ravel()),
        }    


        return jsonify(v1)  
        
        
    
    
#重磁数据的联合反演 
api.add_resource(gm_cross_gradient_2D, '/gm_cross_gradient_2D')
api.add_resource(gm_cross_gradient_3D, '/gm_cross_gradient_3D')
api.add_resource(gm_data_space_correlation_2D, '/gm_data_space_correlation_2D')
api.add_resource(gm_data_space_correlation_3D, '/gm_data_space_correlation_3D')
api.add_resource(gm_correlation_2D, '/gm_correlation_2D')
api.add_resource(gm_correlation_3D, '/gm_correlation_3D')
api.add_resource(fcrm_2D, '/fcrm_2D')
api.add_resource(fcrm_3D, '/fcrm_3D')




#main function
if __name__ == '__main__':
    app.run(debug = True, host = '0.0.0.0', port = 5052)
    
    
    
    
    
    