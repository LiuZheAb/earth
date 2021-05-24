
clc,clear
subplot(2,2,1);
v=importdata('C:\Users\86156\Desktop\density.csv');
v1=reshape(v(:,4),60,5,40);
[x,y,z]=meshgrid(100:100:500,100:100:6000,100:100:4000);
slice(x,y,z,v1,[250],[],[2000]); 
shading interp;                     %����ͼ���ù⻬����
% shading faceted;                  %��ͼ��֮�ϵ���ʾ��ɫ������
shading flat;                       %ȥ��faceted�ϵ�������
set(gca,'zdir','reverse');          %z�᷽��ת��zdir��
% set(gca,'ydir','reverse'); 
axis equal;                           %�̶ȷ�Χ��һ��һ���������������ε�
% xlabel('X(m)');ylabel('Y(m)');zlabel('Z(m)'); 
% view(60,10);
% axis([0 5000 0 15000 0 10000]);
% axis([0 500 0 15000 0 10000]);
axis([0 500 0 6000 0 4000]);
h=colorbar;    colormap('jet');
% caxis([0 0.1]);
set(get(h,'Title'),'string','A/m');  
title('model1 magnetization 3D.csv');


subplot(2,2,2);
v=importdata('C:\Users\86156\Desktop\magnetization.csv');
v1=reshape(v(:,4),60,5,40);
[x,y,z]=meshgrid(100:100:500,100:100:6000,100:100:4000);
slice(x,y,z,v1,[250],[],[2000]); 
shading interp;                     %����ͼ���ù⻬����
% shading faceted;                  %��ͼ��֮�ϵ���ʾ��ɫ������
shading flat;                       %ȥ��faceted�ϵ�������
set(gca,'zdir','reverse');          %z�᷽��ת��zdir��
% set(gca,'ydir','reverse'); 
axis equal;                           %�̶ȷ�Χ��һ��һ���������������ε�
% xlabel('X(m)');ylabel('Y(m)');zlabel('Z(m)'); 
% view(60,10);
% axis([0 5000 0 15000 0 10000]);
% axis([0 500 0 15000 0 10000]);
axis([0 500 0 6000 0 4000]);
h=colorbar;    colormap('jet');
% caxis([0 0.1]);
set(get(h,'Title'),'string','A/m');  
title('model1 magnetization 3D.csv');


subplot(2,2,3);
v=importdata('C:\Users\86156\Desktop\0.csv');
v1=reshape(v(:,4),60,5,40);
[x,y,z]=meshgrid(100:100:500,100:100:6000,100:100:4000);
slice(x,y,z,v1,[250],[],[2000]); 
shading interp;                     %����ͼ���ù⻬����
% shading faceted;                  %��ͼ��֮�ϵ���ʾ��ɫ������
shading flat;                       %ȥ��faceted�ϵ�������
set(gca,'zdir','reverse');          %z�᷽��ת��zdir��
% set(gca,'ydir','reverse'); 
axis equal;                           %�̶ȷ�Χ��һ��һ���������������ε�
% xlabel('X(m)');ylabel('Y(m)');zlabel('Z(m)'); 
% view(60,10);
% axis([0 5000 0 15000 0 10000]);
% axis([0 500 0 15000 0 10000]);
axis([0 500 0 6000 0 4000]);
h=colorbar;    
colormap('jet');
% caxis([0 0.1]);
set(get(h,'Title'),'string','A/m');  
title('model1 magnetization 3D.csv');


subplot(2,2,4);
v=importdata('C:\Users\86156\Desktop\1.csv');
v1=reshape(v(:,4),60,5,40);
[x,y,z]=meshgrid(100:100:500,100:100:6000,100:100:4000);
slice(x,y,z,v1,[250],[],[2000]); 
shading interp;                     %����ͼ���ù⻬����
% shading faceted;                  %��ͼ��֮�ϵ���ʾ��ɫ������
shading flat;                       %ȥ��faceted�ϵ�������
set(gca,'zdir','reverse');          %z�᷽��ת��zdir��
% set(gca,'ydir','reverse'); 
axis equal;                           %�̶ȷ�Χ��һ��һ���������������ε�
% xlabel('X(m)');ylabel('Y(m)');zlabel('Z(m)'); 
% view(60,10);
% axis([0 5000 0 15000 0 10000]);
% axis([0 500 0 15000 0 10000]);
axis([0 500 0 6000 0 4000]);
h=colorbar;    colormap('jet');
% caxis([0 0.1]);
set(get(h,'Title'),'string','A/m');  
title('model1 magnetization 3D.csv');



% 
% % figure(1);
% %�������⻬���ݵĽ����ʾ����
% subplot(3,3,1);
% % v=importdata('C:\Users\29360\Desktop\smooth_g.dat');
% % v=importdata('F:\����̨\����\FCRM\6-FCRM_Wm_CG_matrixG_Triple\data_20-20-10\result\gravity_inversion.dat');
% v=importdata('D:\��Ŀ�ύ���\crrelation_analysis_joint_inversion\model\model_csv_3D\model1\60-5-40_2\density.csv');
% v1=reshape(v(:,4),60,5,40);
% [x,y,z]=meshgrid(50:100:500,50:100:6000,50:100:4000);
% slice(x,y,z,v1,[150],[],[]); 
% % shading interp;                     %����ͼ���ù⻬����
% % shading faceted;                    %��ͼ��֮�ϵ���ʾ��ɫ������
% % shading flat;                       %ȥ��faceted�ϵ�������
% set(gca,'zdir','reverse');            %z�᷽��ת��zdir��
% axis equal;                           %�̶ȷ�Χ��һ��һ���������������ε�
% xlabel('X(m)');ylabel('Y(m)');zlabel('Z(m)'); 
% % view(90,0);
% axis([0 6000 0 500 0 4000]);        
% h=colorbar;    
% colormap('jet');     %ѡ��jet��Ϊɫ��3
% % caxis([0 0.1]);                     %���õ�ǰ����������ɫͼ��Χ��
% %set(get(h,'Title'),'string','g/cc');  
% title('gravity');



% subplot(3,3,2);
% % v=importdata('C:\Users\29360\Desktop\smooth_m.dat');
% % v=importdata('F:\����̨\����\FCRM\6-FCRM_Wm_CG_matrixG_Triple\data_20-20-10\result\magnetic_inversion.dat');
% v=importdata('C:\Users\86156\Desktop\2.dat');
% v1=reshape(v(:,4),20,20,10);
% [x,y,z]=meshgrid(50:50:1000,50:50:1000,50:50:500);
% slice(x,y,z,v1,[350,750],[750],[250]); 
% % shading interp;                     %����ͼ���ù⻬����
% % shading faceted;                    %��ͼ��֮�ϵ���ʾ��ɫ������
% % shading flat;                       %ȥ��faceted�ϵ�������
% set(gca,'zdir','reverse');            %z�᷽��ת��zdir��
% axis equal;                           %�̶ȷ�Χ��һ��һ���������������ε�
% xlabel('X(m)');ylabel('Y(m)');zlabel('Z(m)'); 
% % set(gca,'ydir','reverse'); 
% view(-30,30);
% % view(90,0);
% axis([0 1000 0 1000 0 500]);        
% h=colorbar;    
% colormap('jet');
% % caxis([0 0.1]);
% %set(get(h,'Title'),'string','g/cc');  
% title('gravity');
% 
% 
% 
% subplot(3,3,4);
% % v=importdata('C:\Users\29360\Desktop\magnetization.dat');
% v=importdata('C:\Users\86156\Desktop\gravity_inversion.dat');
% v1=reshape(v(:,4),20,20,10);
% [x,y,z]=meshgrid(50:50:1000,50:50:1000,50:50:500);
% slice(x,y,z,v1,[350,750],[750],[250]); 
% % shading interp;                     %����ͼ���ù⻬����
% % shading faceted;                    %��ͼ��֮�ϵ���ʾ��ɫ������
% % shading flat;                       %ȥ��faceted�ϵ�������
% set(gca,'zdir','reverse');            %z�᷽��ת��zdir��
% axis equal;                           %�̶ȷ�Χ��һ��һ���������������ε�
% xlabel('X(m)');ylabel('Y(m)');zlabel('Z(m)'); 
% % set(gca,'ydir','reverse'); 
% view(-30,30);
% % view(90,0);
% axis([0 1000 0 1000 0 500]);        
% h=colorbar;    
% colormap('jet');
% % caxis([0 0.1]);
% %set(get(h,'Title'),'string','g/cc');  
% title('magentic');
% 
% 
% subplot(3,3,5);
% % v=importdata('C:\Users\29360\Desktop\magnetization.dat');
% v=importdata('C:\Users\86156\Desktop\magnetic_inversion.dat');
% v1=reshape(v(:,4),20,20,10);
% [x,y,z]=meshgrid(50:50:1000,50:50:1000,50:50:500);
% slice(x,y,z,v1,[350,750],[750],[250]); 
% % shading interp;                     %����ͼ���ù⻬����
% % shading faceted;                    %��ͼ��֮�ϵ���ʾ��ɫ������
% % shading flat;                       %ȥ��faceted�ϵ�������
% set(gca,'zdir','reverse');            %z�᷽��ת��zdir��
% axis equal;                           %�̶ȷ�Χ��һ��һ���������������ε�
% xlabel('X(m)');ylabel('Y(m)');zlabel('Z(m)'); 
% % set(gca,'ydir','reverse'); 
% view(-30,30);
% % view(90,0);
% axis([0 1000 0 1000 0 500]);        
% h=colorbar;    
% colormap('jet');
% % caxis([0 0.1]);
% %set(get(h,'Title'),'string','g/cc');  
% title('magentic');
% 
% 
% subplot(3,3,7);
% % v=importdata('C:\Users\29360\Desktop\magnetization.dat');
% v=importdata('C:\Users\86156\Desktop\gravity_joint_inversion.dat');
% v1=reshape(v(:,4),20,20,10);
% [x,y,z]=meshgrid(50:50:1000,50:50:1000,50:50:500);
% slice(x,y,z,v1,[350,750],[750],[250]); 
% % shading interp;                     %����ͼ���ù⻬����
% % shading faceted;                    %��ͼ��֮�ϵ���ʾ��ɫ������
% % shading flat;                       %ȥ��faceted�ϵ�������
% set(gca,'zdir','reverse');            %z�᷽��ת��zdir��
% axis equal;                           %�̶ȷ�Χ��һ��һ���������������ε�
% xlabel('X(m)');ylabel('Y(m)');zlabel('Z(m)'); 
% % set(gca,'ydir','reverse'); 
% view(-30,30);
% % view(90,0);
% axis([0 1000 0 1000 0 500]);        
% h=colorbar;    
% colormap('jet');
% % caxis([0 0.1]);
% %set(get(h,'Title'),'string','g/cc');  
% title('magentic');
% 
% 
% subplot(3,3,8);
% % v=importdata('C:\Users\29360\Desktop\magnetization.dat');
% v=importdata('C:\Users\86156\Desktop\magnetic_joint_inversion.dat');
% v1=reshape(v(:,4),20,20,10);
% [x,y,z]=meshgrid(50:50:1000,50:50:1000,50:50:500);
% slice(x,y,z,v1,[350,750],[750],[250]); 
% % shading interp;                     %����ͼ���ù⻬����
% % shading faceted;                    %��ͼ��֮�ϵ���ʾ��ɫ������
% % shading flat;                       %ȥ��faceted�ϵ�������
% set(gca,'zdir','reverse');            %z�᷽��ת��zdir��
% axis equal;                           %�̶ȷ�Χ��һ��һ���������������ε�
% xlabel('X(m)');ylabel('Y(m)');zlabel('Z(m)'); 
% % set(gca,'ydir','reverse'); 
% view(-30,30);
% % view(90,0);
% axis([0 1000 0 1000 0 500]);        
% h=colorbar;    
% colormap('jet');
% % caxis([0 0.1]);
% %set(get(h,'Title'),'string','g/cc');  
% title('magentic');
% 
% 
