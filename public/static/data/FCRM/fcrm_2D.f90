

	!-------------------------------------------------------------------------
	!
	! MODULE gravity_magnetic_2D_fcrm_inversion
	!
    !-------------------------------------------------------------------------
    !
    !   Funtion£ gravity_magnetic_2D_fcrm_inversion
    !   Data£º  10/2020
    !   Author£ºSheng Liu
    !
    !--------------------------------------------------------------------------
	MODULE fcrm_2d_gminv


	CONTAINS


    subroutine fcrm_2d_inversion(&
		&z0,B0,tz,tx,az1,ax1,cengshu,x_number,iteration_max,&
		&zzmax,b_low_g,b_up_g,b_low_m,b_up_m,&
		&x_coordinate,m1,m2,mref_g,mref_m,&
		&d_obs_g,d_obs_m,x,z,&
		&lam_g,lam_m,eta_g,eta_m,V1,tk1,C,n_source,n_coordinate)


    use iso_c_binding
    implicit none
	include 'omp_lib.h'


    !model construct
    integer m,n
    double precision,allocatable::z_coordinate(:)
    integer,allocatable::poufen_parame(:)
    double precision::xmin,xmax,zmin,zmax
    double precision,allocatable::x_source(:,:),z_source(:,:)
    !smooth inversion
    double precision,allocatable::wm_m(:,:),w_m(:),wd_m(:)
    double precision::ww_m
    double precision::as_m,ax_m,az_m,lu_m
    double precision,allocatable::wm_g(:,:),w_g(:),wd_g(:)
    double precision::ww_g
    double precision::as_g,ax_g,az_g,lu_g
    integer i,j
    !gaussian voice
    double precision,allocatable::a_gauss_g(:),a_gauss_m(:)
    double precision::normal,mean,sigma,eps
    double precision::PI=3.1415926;
!   local constrain
!   double precision::,allocatable::ws_m(:),ws_g(:)
    double precision::ws_m,ws_g
    !fcm
    integer Cores,types,types1
    double precision::t1,t2,a,b,d
    integer numblocks
	double precision,allocatable::V(:,:),tk(:,:)
    !input data by python
    double precision::B0,tz,tx,az1,ax1
    integer n_coordinate,cengshu,x_number
    integer n_source,iteration_max
    double precision::z0,zzmax
    double precision::lam_g,lam_m,eta_g,eta_m
	double precision::b_low_g,b_up_g,b_low_m,b_up_m
    double precision::x_coordinate(n_coordinate)
    double precision::d_obs_g(n_coordinate),d_obs_m(n_coordinate)
    double precision::mref_g(n_source),mref_m(n_source)
	double precision::m1(n_source),m2(n_source)
	double precision::x(n_source),z(n_source)
	integer C
	double precision::V1(C*2),tk1(C*2)
!
! Python bindings
!
!f2py double precision, intent(in) ::  B0,tz,tx,ax1,az1
!f2py integer, intent(in) :: n_coordinate,cengshu,x_number
!f2py integer, intent(in) :: n_source,iteration_max
!f2py integer, intent(in) :: x_n_coordinate
!f2py double precision, intent(in) ::  z0,zzmax
!f2py double precision, intent(in) ::  lam_g,lam_m,eta_g,eta_m
!f2py double precision, intent(in) ::  b_low_g,b_up_g,b_low_m,b_up_m
!f2py double precision, intent(in) ::  x_coordinate
!f2py double precision, intent(in) ::  d_obs_g,d_obs_m
!f2py double precision, intent(in,out) :: m1,m2
!f2py double precision, intent(in) :: mref_g,mref_m
!f2py double precision, intent(in,out) :: x,z
!f2py integer, intent(in) :: C
!f2py double precision, intent(in) ::  V1,tk1


	write(*,*)'GM 2D FCRM inversion.'
!    numblocks=acc_get_num_devices(acc_device_nvidia);
!    write(*,*)'number_host_device';
!    print *,numblocks;
    Cores=omp_get_num_procs( );
    write(*,*)'How many cores does this machine have?'
    write(*,*)Cores
    call omp_set_num_threads(Cores*2-5);
    write(*,*)'What is the number of threads opened by this program?'
    write(*,*)Cores*2-5;


    !read basic information
    xmin=minval(x_coordinate);
    xmax=maxval(x_coordinate);
!    tz=tz/180.0*PI;
!    tx=tx/180.0*PI;
!    az1=az1/180.0*PI;
!    ax1=ax1/180.0*PI;


    allocate(V(C,2),tk(C,2));
	do i=1,C,1
		do j=1,2,1
		   V(i,j)=V1((i-1)*2+j);
		   tk(i,j)=tk1((i-1)*2+j);
	    enddo
    enddo


    allocate(z_coordinate(n_coordinate));
    call input_coordinate_2d_vertical_reg(&
		&z_coordinate,z0,n_coordinate);


    allocate(a_gauss_g(n_coordinate),a_gauss_m(n_coordinate));
	sigma=0.02;
	call add_voice(&
	    &a_gauss_g,d_obs_g,n_coordinate,sigma);
	d_obs_g=d_obs_g+a_gauss_g;
	call add_voice(&
	    &a_gauss_m,d_obs_m,n_coordinate,sigma);
	d_obs_m=d_obs_m+a_gauss_m;



	allocate(poufen_parame(cengshu));
	call read_n_source(&
	    &cengshu,x_number,poufen_parame,n_source);
	allocate(x_source(n_source,2),z_source(n_source,2));
	call read_source(&
	    &xmax,xmin,cengshu,poufen_parame,&
		&x_source,n_source);
	call read_z_source(&
	    &n_source,poufen_parame,&
        &z_source,zzmax,z0,cengshu);
    write(*,*)


    allocate(w_g(n_source),w_m(n_source));
    call depth_weighted_li_g(&
        &w_g,n_source,z_source);
    call depth_weighted_li_m(&
        &w_m,n_source,z_source);


    allocate(wd_g(n_coordinate),wd_m(n_coordinate));
    call com_wd(&
        &n_coordinate,wd_g,d_obs_g,sigma,a_gauss_g);
    call com_wd(&
        &n_coordinate,wd_m,d_obs_m,sigma,a_gauss_m);
    deallocate(a_gauss_g,a_gauss_m);


    !smooth inversion
    write(*,*)'Comput length scale:as,ax,ay,az';
    call length_scale(&
        &xmin,xmax,as_g,ax_g,az_g,poufen_parame,&
        &cengshu,zzmax,zmax);
    call length_scale(&
        &xmin,xmax,as_m,ax_m,az_m,poufen_parame,&
        &cengshu,zzmax,zmax);


    ww_g=1.0;
    ww_m=1.0;
    ws_g=1.0;
    ws_m=1.0;
    mref_g=0.0;mref_m=0.0;

!    !smooth_inversion_gravity_magnetic
!	call CG_triple_reweight_g(&
!		&m1,mref_g,d_obs_g,wd_g,w_g,lu_g,&
!		&cengshu,poufen_parame,as_g,ax_g,az_g,ws_g,ww_g,&
!		&n_source,n_coordinate,x_source,z_source,&
!		&x_coordinate,z_coordinate,b_low_g,b_up_g,iteration_max);
!
!
!	call CG_triple_reweight_m(&
!		&m2,mref_m,d_obs_m,wd_m,w_m,lu_m,&
!		&cengshu,poufen_parame,as_m,ax_m,az_m,ws_m,ww_m,&
!		&n_source,n_coordinate,x_source,z_source,&
!		&x_coordinate,z_coordinate,&
!		&tx,tz,ax1,az1,B0,b_low_m,b_up_m,iteration_max);



    write(*,*)
    write(*,*)'---------------------------------------------------------'
    write(*,*)'FCRM inversion';


    call fcrm_triple_2D_joint_inversion( &
        &m1,mref_g,d_obs_g,wd_g,w_g,lu_g,&
        &m2,mref_m,d_obs_m,wd_m,w_m,lu_m,&
        &cengshu,poufen_parame,&
        &as_g,ax_g,az_g,ws_g,ww_g,&
        &as_m,ax_m,az_m,ws_m,ww_m,&
        &C,n_source,n_coordinate,&
        &x_source,z_source,&
        &x_coordinate,z_coordinate,&
        &tx,tz,ax1,az1,B0,lam_g,lam_m,eta_g,eta_m,&
        &b_low_g,b_up_g,b_low_m,b_up_m,iteration_max,V,tk);


	do i=1,n_source,1
		x(i)=(x_source(i,1)+x_source(i,2))/2.0;
		z(i)=(z_source(i,1)+z_source(i,2))/2.0;
    enddo


    deallocate(wd_g,w_g);
    deallocate(wd_m,w_m);
    deallocate(x_source,z_source,poufen_parame);
    deallocate(z_coordinate);
	deallocate(V,tk);


	return
    end subroutine fcrm_2d_inversion


    !----------------------------------------------------
    !
    !    功能:读取规则网(.grd)(曲面或平面规则网)的数据(坐标)
    !	 输入:input_file_coordinate,n_coordinate
    !	 输出:z_coordinate
    !
    !----------------------------------------------------
    Subroutine input_coordinate_2d_vertical_reg(&
           &z_coordinate,z0,n_coordinate)


    integer i,j,xy,k,n_coordinate
    double precision::z_coordinate(n_coordinate)
    double precision::z0
    integer m,n


    m=n_coordinate;
    do j=1,m,1
		z_coordinate(j)=z0;
    enddo


    End	 subroutine input_coordinate_2d_vertical_reg


    !----------------------------------------------------------------
    !
    !  function:依据刘圣博的加载误差的观点在原来异常数据中加上误差值
    !  input：d_obs,n_coordinate,sigma
    !  output：a_gauss
    !
    !----------------------------------------------------------------
    Subroutine add_voice(&
		   &a_gauss,d_obs,n_coordinate,sigma)
    implicit none

    integer n_coordinate
    double precision::d_obs(n_coordinate),a_gauss(n_coordinate),sigma,a
    integer i

    a=maxval(d_obs);

    !$omp parallel
    !$omp do private(i) schedule(guided)
    do i=1,n_coordinate,1
        a_gauss(i) = a*sigma;
    enddo
    !$omp end do
    !$omp end parallel

    return
    End subroutine add_voice


    !---------------------------------------------------------------------------
    !
    !  功能：读取剖分参数，剖分层数，每层剖分情况
    !  输入：
    !  输出：cengshu,poufen_parame,n_source
    !
    !---------------------------------------------------------------------------
    Subroutine read_n_source(&
		   &cengshu,x_number,poufen_parame,n_source)
    implicit none

    integer cengshu,n_source,x_number,k
    integer poufen_parame(cengshu)


    n_source=0
    do k=1,cengshu,1
        poufen_parame(k)=x_number;
        n_source=n_source+poufen_parame(k);
    enddo


    End subroutine read_n_source


    !---------------------------------------------------------------------------
    !
    !  功能：计算分层后各个场源的坐标值，针对的是不考虑地形的问题
    !  输入：types:1(平面部分)
    !  输出：
    !
    !---------------------------------------------------------------------------
    Subroutine read_source(&
           &xmax,xmin,cengshu,poufen_parame,x_source,n_source)
    implicit none

    integer i,j,k,n1,n2,n21
    integer l
    integer cengshu,n_source
    integer poufen_parame(cengshu)
    double precision::x_source(n_source,2)
    double precision::xmax,xmin,ymax,ymin


    !计算场源的x和y的坐标
    n2=0;
    n1=1;
    n21=0;
    do k=1,cengshu,1
    n2=n21+poufen_parame(k);
    do i=n1,n2,1
        l=poufen_parame(k)

        if(mod(i,l).eq.0)then
            x_source(i,2)=xmax
            x_source(i,1)=xmax-(xmax-xmin)/l
        endif
        if(mod(i,l).ne.0)then
            x_source(i,1)=xmin+(xmax-xmin)/l*(mod(i,l)-1)
            x_source(i,2)=x_source(i,1)+(xmax-xmin)/l
        endif
    enddo
    n1=n2+1;
    n21=n2;
    enddo


    End subroutine read_source

    !---------------------------------------------------------------------------
    !
    !  功能：对地下剖分的网格场源进行z方向的坐标化
    !  输入：n_source,poufen_parame,zzmax,zmax,cengshu
    !  输出：z_source
    !
    !---------------------------------------------------------------------------
    Subroutine read_z_source(&
		   &n_source,poufen_parame,z_source,zzmax,z0,cengshu)
    implicit none


    integer n2,n1,cengshu,n_source,n_coordinate,i,k,j
    double precision::z_source(n_source,2)
    integer poufen_parame(cengshu)
    double precision::zmax,zzmax,z0,l


    zmax=z0+5.0;
    l=(zzmax-zmax)/(cengshu);
    n1=0;
    n2=1;
    do i=1,cengshu,1
        n1=n1+poufen_parame(i)
        do j=n2,n1,1
            z_source(j,1)=zmax+l*(i-1);
            z_source(j,2)=z_source(j,1)+l;
        enddo
        n2=n1+1;
    enddo


    End subroutine read_z_source


    !--------------------------------------------------------------------
    !
    !  功 能：深度加权函数( 参看文献02 )
    !  输 入：n_source,z_source
    !  输 出：wz
    !
    !--------------------------------------------------------------------
    Subroutine depth_weighted_li_g(&
		   &wz,n_source,z_source )
    implicit none

    integer n_source,i
    double precision::wz(n_source),z_source(n_source,2),z(n_source),z0


    !$acc kernels
    do i=1,n_source,1
        z(i)=(z_source(i,1)+z_source(i,2))/2.0;
    enddo
    !$acc end kernels


    z0=(z_source(1,2)-z_source(1,1))/2.0;
    wz=0.0;
    !$acc kernels
    do i=1,n_source,1
        wz(i)=1.0/((z(i)+z0)**(1.0));
    enddo
    !$acc end kernels


    return
    End subroutine depth_weighted_li_g


    !----------------------------------------------------------------------
    !
    !  功 能：深度加权函数( 参看文献02 )
    !  输 入：n_source,z_source
    !  输 出：wz
    !
    !--------------------------------------------------------------------
    Subroutine depth_weighted_li_m(wz,n_source,z_source)
    implicit none


    integer n_source,i
    double precision::wz(n_source),z_source(n_source,2),z(n_source),z0


    !$acc kernels
    do i=1,n_source,1
        z(i)=( z_source(i,1)+z_source(i,2) )/2.0 ;
    enddo
    !$acc end kernels


    z0=(z_source(1,2)-z_source(1,1))/2.0;
    wz=0.0;
    !$acc kernels
    do i=1,n_source,1
        wz(i)= 1.0/(abs(z(i)+z0)**(3.0/2.0));
    enddo
    !$acc end kernels


    return
    End subroutine depth_weighted_li_m

    !---------------------------------------------------------------------------
    !
    !  功能：计算alpha系数，分别对应于目标函数的各项. 文献2（值在0-1之间）(没有问题)
    !  输入：xmin,xmax,poufen_parame,cengshu
    !  输出：as,ax,az
    !
    !---------------------------------------------------------------------------
    subroutine length_scale(xmin,xmax,&
           &as,ax,az,poufen_parame,cengshu,zzmax,zmax)

    implicit none

    double precision::xmin,xmax,ax,as,az,d_x,d_z,zzmax,zmax
    integer cengshu,poufen_parame(cengshu)


    d_x=(xmax-xmin)/poufen_parame(1);
    d_z=(zzmax-zmax)/cengshu ;


!    ax=(2*d_x)**2*as*1.0;
    ax=1.0;
    as=ax/( (2*d_x)**2*1.0 );
    az=(2*d_z)**2*as*1.0;
    write(*,*)as,ax,az


    end subroutine  length_scale

    !--------------------------------------------------------------------------
    !
    !  功能：计算wx,wz,ws权重系数（有无先验信息时候再具体采用不同的方法再进行计算,
    !                                约束反演模型在南北、东西、及其垂向的平滑与渐变程度）
    !  输入：          (没有问题)
    !  输出：
    !
    !--------------------------------------------------------------------------
    subroutine weighting(ww,n_source)
    implicit none

    integer n_source,i
    double precision::ww(n_source)


    ww=0.0
    !$acc kernels
    do i=1,n_source,1
        ww(i)=sqrt(1.0)
    enddo
    !$acc end kernels


    end subroutine weighting


    !---------------------------------------------------------------------------
    !
    !  功能：计算wx,wy,wz,ws权重系数（有无先验信息时候再具体采用不同的方法再进行计算,约束反演模型在南北、东西、及其垂向的平滑与渐变程度）
    !  输入：          (没有问题)
    !  输出：
    !
    !---------------------------------------------------------------------------
    subroutine weighting1(ww,n_source)
    implicit none

    integer n_source,i
    double precision::ww(n_source)


    ww=0.0
    !$acc kernels
    do i=1,n_source,1
        ww(i)=1.0;
    enddo
    !$acc end kernels


    end subroutine weighting1


    !-------------------------------------------------------------------------
    !
    !  功 能：在拟定的误差限之内进行wd数据的创建,采用文献6或者采用0.1mgal误差限计算
    !  输 入：eps
    !  输 出：wd
    !
    !---------------------------------------------------------------------------
    Subroutine com_wd(&
		   &n_coordinate,wd,d_obs,sigma,a_gauss)
    implicit none

    integer n_coordinate,i
    double precision::wd(n_coordinate),d_obs(n_coordinate),&
           &a_gauss(n_coordinate)
    double precision::sigma


    wd=0.0;
    !$acc kernels
    do i=1,n_coordinate,1
        wd(i)=1.0/a_gauss(i);
    enddo
    !$acc end kernels


    return
    End subroutine com_wd


    !---------------------------------------------------------------------------
    !
    !  功 能：计算模型约束项的梯度,加上深度加权
    !  输 入：as,ax,az,ww,w
    !  输 出：Wm*Wm*m
    !   Wm(n,n) = [as*ws101*ds*w(n)]^2 + [ax*dx(n,n)*w(n)]^2 + ……
    !---------------------------------------------------------------------------
    Subroutine computation_WWm(&
           &x_source,z_source,n_source,cengshu,&
           &poufen_parame,as,ax,az,ws101,ww,&
           &n_coordinate,w,m,wwm)
    implicit none


    integer n_coordinate,n_source,cengshu
    integer poufen_parame(cengshu)
    integer nx,nz
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::d_x,d_z,ds
    double precision,allocatable::dx(:,:),dz(:,:)
    double precision::ax,as,az
    double precision::w(n_source),ww,ws101
    double precision::m(n_source),wwm(n_source)
    double precision,allocatable::ws(:),wx(:,:),wz(:,:)
    double precision,allocatable::ws2(:),wx1(:),wz1(:),wx2(:),wz2(:)
	integer i,j,k,kk,l,l1,k1


    !均匀剖分
    d_x=x_source(1,2)-x_source(1,1);
    d_z=z_source(1,2)-z_source(1,1);

    !计算：ds
    ds=1.0*sqrt(d_x*d_z);
    !计算：Ws=α*D*Z：as*ds*wz
    allocate(ws(n_source));
    ws=0.0;
    ws=as*ws101*ds*w;


    !计算梯度：Ws'*Ws*m
    allocate(ws2(n_source));
    ws2=0.0;
    do i=1,n_source,1
        ws2(i)=ws(i)*ws(i)*m(i);
    enddo
    deallocate(ws);
    wwm=0.0;
    wwm=ws2;
    deallocate(ws2);


    !-----------------------------------------------------------
    !计算：dx
    nx=(poufen_parame(1)-1)*cengshu*2;
    allocate(dx(nx,3));
    dx=0.0;
    k=0;
    do i=1,n_source,1
        if( ( mod(i,poufen_parame(1)) ).ne.0 )then
            k=k+1;
            dx(k,1)=i;  dx(k,2)=i;    dx(k,3)=-1;
            k=k+1;
            dx(k,1)=i;  dx(k,2)=i+1;  dx(k,3)=1;
        endif
    enddo


    !计算：Wx=α*D*Z：ax*dx*wz
    allocate(wx(nx,3));
    wx=0.0;
!    !$omp parallel
!    !$omp do private(i) schedule(guided)
    do i=1,nx,1
        wx(i,1)=dx(i,1);
        wx(i,2)=dx(i,2);
        k=dx(i,2);
        wx(i,3)=ax*dx(i,3)*w(k);
    enddo
!    !$omp end do
!    !$omp end parallel
    deallocate(dx);


    !计算梯度中间量：Wx1=Wx*m
    allocate(wx1(n_source));
    wx1=0.0;
!    !$omp parallel
!    !$omp do private(i) schedule(guided)
    do i=1,nx-1,2
        j=wx(i,1);  k=wx(i,2);  l=wx(i+1,2);
        wx1(j)=wx(i,3)*m(k)+wx(i+1,3)*m(l);
    enddo
!    !$omp end do
!    !$omp end parallel


    !计算梯度：Wx2=Wx'*(Wx*m)=Wx'*Wx1
    allocate(wx2(n_source));
    wx2=0.0;
!    !$omp parallel
!    !$omp do private(j) schedule(guided)
!    do j=1,n_source,1
!        do i=1,nx,1
!            if(wx(i,2).eq.j)then
!                k=wx(i,1);
!                wx2(j)=wx2(j)+wx(i,3)*wx1(k);
!            endif
!        enddo
!    enddo


    do j=1,n_source,1
!        write(*,*)'j',j;
        if( ( mod(j,poufen_parame(1)) ).eq.0 )then
            !对应每行的最后一个点
            l=2*( j/poufen_parame(1) )*( poufen_parame(1)-1 );
            k=wx(l,1);
            wx2(j) = wx(l,3)*wx1(k);
!            write(*,*)k;
        elseif( ( mod(j,poufen_parame(1)) ).eq.1 )then
            !对应每行的第一个点
            l=2*( int(j/poufen_parame(1)) )*( poufen_parame(1)-1 )+1;
            k=wx(l,1);
            wx2(j) = wx(l,3)*wx1(k);
!            write(*,*)k;
        elseif( ( mod(j,poufen_parame(1)) ).gt.1 )then
            !每列的上一个点（对应上一行的第二个点）——Wx矩阵未进行转置
            l1=2*( j - int( j/poufen_parame(1) ) -1 );
            k1=wx(l1,1);
            !每列的下一个点（对应行的第一个点）
            l=2*( j - int( j/poufen_parame(1) ) )-1;
            k=wx(l,1);
            wx2(j) = wx(l1,3)*wx1(k1) + wx(l,3)*wx1(k);
!            write(*,*)k1;
!            write(*,*)k;
        endif
    enddo
!    !$omp end do
!    !$omp end parallel
    deallocate(wx1,wx);
    wwm=wwm+wx2;
    deallocate(wx2);
!stop;


    !-----------------------------------------------------------
    !计算dz
    nz=poufen_parame(1)*(cengshu-1)*2;
    allocate(dz(nz,3));
    dz=0.0;
    k=0;
    kk=poufen_parame(1);
    do i=1,(n_source-kk),1
        k=k+1;
        dz(k,1)=i;  dz(k,2)=i;     dz(k,3)=-1;
        k=k+1;
        dz(k,1)=i;  dz(k,2)=i+kk;  dz(k,3)=1;
    enddo

    !计算Wz=α*D*Z：az*dz*wz
    allocate(wz(nz,3));
    wz=0.0;
    do i=1,nz,1
        wz(i,1)=dz(i,1);
        wz(i,2)=dz(i,2);
        k=dz(i,2);
        wz(i,3)=az*dz(i,3)*w(k);
    enddo
    deallocate(dz);

    !计算梯度中间量：Wz1=Wz*m
    allocate(wz1(n_source-kk));
    wz1=0.0;
!    !$omp parallel
!    !$omp do private(i) schedule(guided)
    do i=1,nz-1,2
        j=wz(i,1);  k=wz(i,2);  l=wz(i+1,2);
        wz1(j)=wz(i,3)*m(k)+wz(i+1,3)*m(l);
    enddo
!    !$omp end do
!    !$omp end parallel

    !计算梯度：Wz2=Wz'*(Wz*m)=Wz'*Wz1
    allocate(wz2(n_source));
    wz2=0.0;
!    !$omp parallel
!    !$omp do private(j) schedule(guided)
    do j=1,n_source,1
        if( j.le.kk )then
            l=2*J-1;
            k=wz(l,1);
            wz2(j)=wz(l,3)*wz1(k);
        elseif( (j.gt.kk).and.(j.le.(n_source-kk)) )then
            l1=2*(J-kk);
            k1=wz(l1,1);
            l=2*J-1;
            k=wz(l,1);
            wz2(j)=wz(l1,3)*wz1(k1)+wz(l,3)*wz1(k);
        elseif( j.gt.(n_source-kk) )then
            l=2*(J-kk);
            k=wz(l,1);
            wz2(j)=wz(l,3)*wz1(k);
        endif
    enddo
!    !$omp end do
!    !$omp end parallel
    deallocate(wz1,wz);


    wwm=wwm+wz2;
    deallocate(wz2);


    return
    End subroutine  computation_WWm


    !---------------------------------------------------------------------------
    !
    !  功 能：计算模型约束项
    !  输 入：as,ax,az,ws,ww,wz,(m1-mref)
    !  输 出：(m1-mref)*Wm*Wm*(m1-mref)
    !
    !---------------------------------------------------------------------------
    Subroutine computation_module_valaue(&
           &x_source,z_source,n_source,cengshu,&
           &poufen_parame,as,ax,az,ws101,ww,&
           &n_coordinate,w,m,mWWm)
    implicit none


    integer n_coordinate,n_source,i,j,k,kk,l,cengshu
    integer poufen_parame(cengshu)
    integer nx,nz
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::d_x,d_z,ds
    double precision,allocatable::dx(:,:),dz(:,:)
    double precision::ax,as,az
    double precision::w(n_source),ww,ws101
    double precision::m(n_source),mWWm
    double precision,allocatable::ws(:),wx(:,:),wz(:,:)
    double precision,allocatable::ws1(:),wx1(:),wz1(:)
    double precision::ws2,wx2,wz2


    !均匀剖分的情况
    d_x=x_source(1,2)-x_source(1,1);
    d_z=z_source(1,2)-z_source(1,1);

    !计算ds
    ds=1.0*sqrt(d_x*d_z);
    !计算Ws=α*D*Z：as*ds*wz
    allocate(ws(n_source));
    ws=0.0;
    ws=as*ws101*ds*w;

    !计算Ws1=Ws*m
    allocate(ws1(n_source));
    ws1=0.0;
    do i=1,n_source,1
        ws1(i)=ws(i)*m(i);
    enddo
    deallocate(ws);

    !计算Ws2=(Ws*m)'*Ws*m=Ws1'*Ws1
    ws2=0.0;
    !$acc parallel
    !$acc loop reduction(+:ws2)
    do i=1,n_source
        ws2=ws2+ws1(i)*ws1(i);
    enddo
    !$acc end loop
    !$acc end parallel
    deallocate(ws1);

    !-----------------------------------------------------------
    !计算dx
    nx=(poufen_parame(1)-1)*cengshu*2;
    allocate( dx(nx,3) );
    dx=0.0;
    k=0;
    do i=1,(n_source-1),1
        if( ( mod( i,poufen_parame(1) ) ).ne.0 )then
            k=k+1;
            dx(k,1)=i;  dx(k,2)=i;    dx(k,3)=-1;
            k=k+1;
            dx(k,1)=i;  dx(k,2)=i+1;  dx(k,3)=1;
        endif
    enddo

    !计算Wx=α*D*Z：ax*dx*wz
    allocate(wx(nx,3));
    wx=0.0;
!    !$omp parallel
!    !$omp do private(i) schedule(guided)
    do i=1,nx,1
        wx(i,1)=dx(i,1);
        wx(i,2)=dx(i,2);
        k=dx(i,2);
        wx(i,3)=ax*dx(i,3)*w(k);
    end do
!    !$omp end do
!    !$omp end parallel
    deallocate(dx);

    !计算：Wx1=Wx*m
    allocate(wx1(n_source));
    wx1=0.0;
!    !$omp parallel
!    !$omp do private(i) schedule(guided)
    do i=1,nx-1,2
        j=wx(i,1); k=wx(i,2); l=wx(i+1,2);
        wx1(j)=wx(i,3)*m(k)+wx(i+1,3)*m(l);
    end do
!    !$omp end do
!    !$omp end parallel

    !计算Wx2=(Wx*m)'*Wx*m=Wx1'*Wx1
    wx2=0.0;
    !$acc parallel
    !$acc loop reduction(+:wx2)
    do i=1,n_source,1
        wx2=wx2+wx1(i)*wx1(i);
    enddo
    !$acc end loop
    !$acc end parallel
    deallocate(wx1);

    !-----------------------------------------------------------
    !计算dz
    nz=poufen_parame(1)*(cengshu-1)*2;
    allocate(dz(nz,3));
    dz=0.0;
    k=0;
    kk=poufen_parame(1);
    do i=1,(n_source-kk),1
        k=k+1;
        dz(k,1)=i;  dz(k,2)=i;     dz(k,3)=-1;
        k=k+1;
        dz(k,1)=i;  dz(k,2)=i+kk;  dz(k,3)=1;
    enddo

    !计算Wz=α*D*Z：az*dz*wz
    allocate(wz(nz,3));
    wz=0.0;
!    !$omp parallel
!    !$omp do private(i) schedule(guided)
    do i=1,nz,1
        wz(i,1)=dz(i,1);
        wz(i,2)=dz(i,2);
        k=dz(i,2);
        wz(i,3)=az*dz(i,3)*w(k);
    enddo
!    !$omp end do
!    !$omp end parallel
    deallocate(dz);

    !计算梯度中间量：Wz1=Wz*m
    allocate(wz1(n_source));
    wz1=0.0;
!    !$omp parallel
!    !$omp do private(i) schedule(guided)
    do i=1,nz-1,2
        j=wz(i,1); k=wz(i,2); l=wz(i+1,2);
        wz1(j)=wz(i,3)*m(k)+wz(i+1,3)*m(l);
    end do
!    !$omp end do
!    !$omp end parallel

    !计算Wz2=(Wz*m)'*Wz*m=Wz1'*Wz1
    wz2=0.0;
    !$acc parallel
    !$acc loop reduction(+:wz2)
    do i=1,n_source,1
        wz2=wz2+wz1(i)*wz1(i);
    enddo
    !$acc end loop
    !$acc end parallel
    deallocate(wz1);

    mWWm=ws2+wx2+wz2;


    return
    End subroutine  computation_module_valaue


	!---------------------------------------------------------------------------
    !
    !  功 能：计算模型约束项的梯度,加上深度加权
    !  输 入：as,ax,az,ww,w
    !  输 出：Wm_w*Wm_w*(m1_w - mref_w)
    !
    !---------------------------------------------------------------------------
    Subroutine computation_WWm_re(&
           &x_source,z_source,n_source,cengshu,&
           &poufen_parame,as,ax,az,ws101,ww,&
           &n_coordinate,w,m,wwm)
    implicit none


    integer n_coordinate,n_source,cengshu
    integer poufen_parame(cengshu)
    integer nx,nz
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::d_x,d_z,ds
    double precision,allocatable::dx(:,:),dz(:,:)
    double precision::ax,as,az
    double precision::w(n_source),ww,ws101
    double precision::m(n_source),wwm(n_source)
    double precision,allocatable::ws(:),wx(:,:),wz(:,:)
    double precision,allocatable::ws2(:),wx1(:),wz1(:),wx2(:),wz2(:)
	integer i,j,k,kk,l,l1,k1


    !均匀剖分
    d_x=x_source(1,2)-x_source(1,1);
    d_z=z_source(1,2)-z_source(1,1);

    !计算：ds
    ds=1.0*sqrt(d_x*d_z);
    !计算：Ws=α*D*Z：as*ds*w*(w-1)=as*ds
    allocate(ws(n_source));
    ws=0.0;
    ws=as*ws101*ds;

    !计算梯度：Ws'*Ws*m
    allocate(ws2(n_source));
    ws2=0.0;
    do i=1,n_source,1
        ws2(i)=ws(i)*ws(i)*m(i);
    enddo
    deallocate(ws);
    wwm=0.0;
    wwm=ws2;
    deallocate(ws2);


    !-----------------------------------------------------------
    !计算：dx
    nx=(poufen_parame(1)-1)*cengshu*2;
    allocate(dx(nx,3));
    dx=0.0;
    k=0;
    do i=1,n_source,1
        if( ( mod(i,poufen_parame(1)) ).ne.0 )then
            k=k+1;
            dx(k,1)=i;  dx(k,2)=i;    dx(k,3)=-1;
            k=k+1;
            dx(k,1)=i;  dx(k,2)=i+1;  dx(k,3)=1;
        endif
    enddo


    !计算：Wx=α*D*Z：ax*dx*w*(w-1)=ax*dx
    allocate(wx(nx,3));
    wx=0.0;
!    !$omp parallel
!    !$omp do private(i) schedule(guided)
    do i=1,nx,1
        wx(i,1)=dx(i,1);
        wx(i,2)=dx(i,2);
        k=dx(i,2);
!        wx(i,3)=ax*dx(i,3)*w(k);
        wx(i,3)=ax*dx(i,3);
    enddo
!    !$omp end do
!    !$omp end parallel
    deallocate(dx);


    !计算梯度中间量：Wx1=Wx*m
    allocate(wx1(n_source));
    wx1=0.0;
!    !$omp parallel
!    !$omp do private(i) schedule(guided)
    do i=1,nx-1,2
        j=wx(i,1);  k=wx(i,2);  l=wx(i+1,2);
        wx1(j)=wx(i,3)*m(k)+wx(i+1,3)*m(l);
    enddo
!    !$omp end do
!    !$omp end parallel


    !计算梯度：Wx2=Wx'*(Wx*m)=Wx'*Wx1
    allocate(wx2(n_source));
    wx2=0.0;
!    !$omp parallel
!    !$omp do private(j) schedule(guided)
!    do j=1,n_source,1
!!        write(*,*)'j',j;
!        do i=1,nx,1             !nx=(poufen_parame(1)-1)*cengshu*2;
!            if(wx(i,2).eq.j)then
!                k=wx(i,1);
!!                write(*,*)k;
!                wx2(j)=wx2(j)+wx(i,3)*wx1(k);
!            endif
!        enddo
!    enddo


    do j=1,n_source,1
!        write(*,*)'j',j;
        if( ( mod(j,poufen_parame(1)) ).eq.0 )then
            l=2*( j/poufen_parame(1) )*( poufen_parame(1)-1 );
            k=wx(l,1);
            wx2(j) = wx(l,3)*wx1(k);
!            write(*,*)k;
        elseif( ( mod(j,poufen_parame(1)) ).eq.1 )then
            l=2*( int(j/poufen_parame(1)) )*( poufen_parame(1)-1 )+1;
            k=wx(l,1);
            wx2(j) = wx(l,3)*wx1(k);
!            write(*,*)k;
        elseif( ( mod(j,poufen_parame(1)) ).gt.1 )then
            !每列的上一个点（对应上一行的第二个点）——Wx矩阵未进行转置
            l1=2*( j - int( j/poufen_parame(1) ) -1 );
            k1=wx(l1,1);
            !每列的下一个点（对应行的第一个点）
            l=2*( j - int( j/poufen_parame(1) ) )-1;
            k=wx(l,1);
            wx2(j) = wx(l1,3)*wx1(k1) + wx(l,3)*wx1(k);
!            write(*,*)k1;
!            write(*,*)k;
        endif
    enddo
!    !$omp end do
!    !$omp end parallel
    deallocate(wx1,wx);
    wwm=wwm+wx2;
    deallocate(wx2);
!stop;


    !-----------------------------------------------------------
    !计算dz
    nz=poufen_parame(1)*(cengshu-1)*2;
    allocate(dz(nz,3));
    dz=0.0;
    k=0;
    kk=poufen_parame(1);
    do i=1,(n_source-kk),1
        k=k+1;
        dz(k,1)=i;  dz(k,2)=i;     dz(k,3)=-1;
        k=k+1;
        dz(k,1)=i;  dz(k,2)=i+kk;  dz(k,3)=1;
    enddo


    !计算Wz=α*D*Z：az*dz*w*(w-1)=az*dz
    allocate(wz(nz,3));
    wz=0.0;
    do i=1,nz,1
        wz(i,1)=dz(i,1);
        wz(i,2)=dz(i,2);
        k=dz(i,2);
!        wz(i,3)=az*dz(i,3)*w(k);
        wz(i,3)=az*dz(i,3);
    enddo
    deallocate(dz);


    !计算梯度中间量：Wz1=Wz*m
    allocate(wz1(n_source-kk));
    wz1=0.0;
!    !$omp parallel
!    !$omp do private(i) schedule(guided)
    do i=1,nz-1,2
        j=wz(i,1);  k=wz(i,2);  l=wz(i+1,2);
        wz1(j)=wz(i,3)*m(k)+wz(i+1,3)*m(l);
    enddo
!    !$omp end do
!    !$omp end parallel


    !计算梯度：Wz2=Wz'*(Wz*m)=Wz'*Wz1
    allocate(wz2(n_source));
    wz2=0.0;
!    !$omp parallel
!    !$omp do private(j) schedule(guided)
    do j=1,n_source,1
!        write(*,*)'j',j;
        if( j.le.kk )then
            l=2*j-1;
            k=wz(l,1);
            wz2(j)=wz(l,3)*wz1(k);
!            write(*,*)k;
        elseif( (j.gt.kk).and.(j.le.(n_source-kk)) )then
            l1=2*(j-kk);
            k1=wz(l1,1);
            l=2*j-1;
            k=wz(l,1);
            wz2(j)=wz(l1,3)*wz1(k1)+wz(l,3)*wz1(k);
!            write(*,*)k1;
!            write(*,*)k;
        elseif( j.gt.(n_source-kk) )then
            l=2*(j-kk);
            k=wz(l,1);
            wz2(j)=wz(l,3)*wz1(k);
!            write(*,*)k;
        endif
    enddo
!stop;
!    !$omp end do
!    !$omp end parallel
    deallocate(wz1,wz);


    wwm=wwm+wz2;
    deallocate(wz2);


    return
    End subroutine  computation_WWm_re


    !---------------------------------------------------------------------------
    !
    !  功 能：计算模型约束项
    !  输 入：as,ax,az,ws,ww,wz,(m1-mref)
    !  输 出：(m1_w-mref_w)*Wm_w*Wm_w*(m1_w-mref_w)
    !
    !---------------------------------------------------------------------------
    Subroutine computation_module_valaue_re(&
           &x_source,z_source,n_source,cengshu,&
           &poufen_parame,as,ax,az,ws101,ww,&
           &n_coordinate,w,m,mWWm)
    implicit none


    integer n_coordinate,n_source,i,j,k,kk,l,cengshu
    integer poufen_parame(cengshu)
    integer nx,nz
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::d_x,d_z,ds
    double precision,allocatable::dx(:,:),dz(:,:)
    double precision::ax,as,az
    double precision::w(n_source),ww,ws101
    double precision::m(n_source),mWWm
    double precision,allocatable::ws(:),wx(:,:),wz(:,:)
    double precision,allocatable::ws1(:),wx1(:),wz1(:)
    double precision::ws2,wx2,wz2


    !均匀剖分的情况
    d_x=x_source(1,2)-x_source(1,1);
    d_z=z_source(1,2)-z_source(1,1);


    !计算ds
    ds=1.0*sqrt(d_x*d_z);
    !计算Ws=α*D*Z：as*ds*w*(w-1)=as*ds
    allocate(ws(n_source));
    ws=0.0;
    ws=as*ws101*ds;


    !计算Ws1=Ws*m
    allocate(ws1(n_source));
    ws1=0.0;
    do i=1,n_source,1
        ws1(i)=ws(i)*m(i);
    enddo
    deallocate(ws);


    !计算Ws2=(Ws*m)'*Ws*m=Ws1'*Ws1
    ws2=0.0;
    !$acc parallel
    !$acc loop reduction(+:ws2)
    do i=1,n_source
        ws2=ws2+ws1(i)*ws1(i);
    enddo
    !$acc end loop
    !$acc end parallel
    deallocate(ws1);


    !-----------------------------------------------------------
    !计算dx
    nx=(poufen_parame(1)-1)*cengshu*2;
    allocate( dx(nx,3) );
    dx=0.0;
    k=0;
    do i=1,(n_source-1),1
        if( ( mod(i,poufen_parame(1)) ).ne.0 )then
            k=k+1;
            dx(k,1)=i;  dx(k,2)=i;    dx(k,3)=-1;
            k=k+1;
            dx(k,1)=i;  dx(k,2)=i+1;  dx(k,3)=1;
        endif
    enddo


    !计算Wx=α*D*Z：ax*dx*w*(w-1)=ax*dx
    allocate(wx(nx,3));
    wx=0.0;
!    !$omp parallel
!    !$omp do private(i) schedule(guided)
    do i=1,nx,1
        wx(i,1)=dx(i,1);
        wx(i,2)=dx(i,2);
        k=dx(i,2);
!        wx(i,3)=ax*dx(i,3)*w(k);
        wx(i,3)=ax*dx(i,3);
    end do
!    !$omp end do
!    !$omp end parallel
    deallocate(dx);


    !计算：Wx1=Wx*m
    allocate(wx1(n_source));
    wx1=0.0;
!    !$omp parallel
!    !$omp do private(i) schedule(guided)
    do i=1,nx-1,2
        j=wx(i,1); k=wx(i,2); l=wx(i+1,2);
        wx1(j)=wx(i,3)*m(k)+wx(i+1,3)*m(l);
    end do
!    !$omp end do
!    !$omp end parallel


    !计算Wx2=(Wx*m)'*Wx*m=Wx1'*Wx1
    wx2=0.0;
    !$acc parallel
    !$acc loop reduction(+:wx2)
    do i=1,n_source,1
        wx2=wx2+wx1(i)*wx1(i);
    enddo
    !$acc end loop
    !$acc end parallel
    deallocate(wx1);


    !-----------------------------------------------------------
    !计算dz
    nz=poufen_parame(1)*(cengshu-1)*2;
    allocate(dz(nz,3));
    dz=0.0;
    k=0;
    kk=poufen_parame(1);
    do i=1,(n_source-kk),1
        k=k+1;
        dz(k,1)=i;  dz(k,2)=i;     dz(k,3)=-1;
        k=k+1;
        dz(k,1)=i;  dz(k,2)=i+kk;  dz(k,3)=1;
    enddo


    !计算Wz=α*D*Z：az*dz*w*(w-1)=az*dz
    allocate(wz(nz,3));
    wz=0.0;
!    !$omp parallel
!    !$omp do private(i) schedule(guided)
    do i=1,nz,1
        wz(i,1)=dz(i,1);
        wz(i,2)=dz(i,2);
        k=dz(i,2);
!        wz(i,3)=az*dz(i,3)*w(k);
        wz(i,3)=az*dz(i,3);
    enddo
!    !$omp end do
!    !$omp end parallel
    deallocate(dz);


    !计算梯度中间量：Wz1=Wz*m
    allocate(wz1(n_source));
    wz1=0.0;
!    !$omp parallel
!    !$omp do private(i) schedule(guided)
    do i=1,nz-1,2
        j=wz(i,1); k=wz(i,2); l=wz(i+1,2);
        wz1(j)=wz(i,3)*m(k)+wz(i+1,3)*m(l);
    end do
!    !$omp end do
!    !$omp end parallel


    !计算Wz2=(Wz*m)'*Wz*m=Wz1'*Wz1
    wz2=0.0;
    !$acc parallel
    !$acc loop reduction(+:wz2)
    do i=1,n_source,1
        wz2=wz2+wz1(i)*wz1(i);
    enddo
    !$acc end loop
    !$acc end parallel
    deallocate(wz1);


    mWWm=ws2+wx2+wz2;


    return
    End subroutine  computation_module_valaue_re


    !------------------------------------------------------------------------
    !
    !  功能：反演结果的正定约束
    !
    !  输入参数说明：
    !                 min：正定约束的下限
    !                 max：正定约束而对上限
    !  输出参数说明：
    !                 m：模型物性参数
    !
    !------------------------------------------------------------------------
    subroutine positive_define_constrain(&
		   &n_source,m1,min2,max2)
    implicit none

    double precision::min2,max2
    integer n_source,i
    double precision::m1(n_source)


    do i=1,n_source,1
        if(m1(i).lt.min2)then
            m1(i)=min2
        endif

        if(m1(i).gt.max2)then
            m1(i)=max2
        endif
    enddo


    return
    end subroutine positive_define_constrain


    !------------------------------------------------------------------------
    !
    !  功能：反演结果的重加权
    !
    !  输出参数说明：
    !                 m_w：模型物性参数
    !
    !------------------------------------------------------------------------
    subroutine reweight_m(&
		    &n_source,m1,w,m_w )
    implicit none

    integer n_source,i
    double precision::m1(n_source),w(n_source),m_w(n_source)


    m_w=0.0;
    do i=1,n_source,1
        m_w(i)=m1(i)*w(i);
    enddo


    return
    end subroutine reweight_m


    !------------------------------------------------------------------------
    !
    !  功能：反演结果的重加权
    !
    !  输出参数说明：
    !                 m_w：模型物性参数
    !
    !------------------------------------------------------------------------
    subroutine Anti_reweighting_m(&
		   &n_source,m_w,w,m1)
    implicit none


    integer n_source,i
    double precision::m1(n_source),w(n_source),m_w(n_source)


    m1=0.0;
    do i=1,n_source,1
        m1(i)=m_w(i)/w(i);
    enddo

    return
    end subroutine Anti_reweighting_m


    !--------------------------------------------------------------------------
    !
    !   行核函数：n_source
    !
    !--------------------------------------------------------------------------
    subroutine computation_G_g_Row(&
           &g1,n_source,x_source,z_source,x,z)
    implicit none

    integer k,n,i,j,l
    integer n_source
    double precision::g1(n_source)
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::x,z
    double precision::x12,y12,z12
    double precision::a
    double precision::r,delt_g
    double precision::g2=6.672*1e-2 !单位换算后，用的是gu

    g1=0.0;
!	!$omp parallel
!    !$omp do private(n) schedule(guided)
    do n=1,n_source,1
       do i=1,2,1
          do j=1,2,1
              x12=x_source(n,i);
              z12=z_source(n,j);
              delt_g=g2*( (x12-x)*log( (x12-x)**2+(z12-z)**2 )+&
                     &2.0*(z12-z)*atan((x12-x)/(z12-z)) );

              g1(n)=g1(n)+((-1)**(i+j))*delt_g;
         enddo
      enddo
    enddo
!    !$omp end do
!    !$omp end parallel

    return
    end	subroutine computation_G_g_Row


    !--------------------------------------------------------------------------
    !
    !   列核函数：n_coordinate
    !
    !--------------------------------------------------------------------------
    subroutine computation_G_g_Column( &
           &g1,n_coordinate,n_source,n,x_source,z_source,&
           &x_coordinate,z_coordinate )
    implicit none


    integer k,i,j,l
    integer n_source,n_coordinate,n
    double precision::g1(n_coordinate)
    double precision::x_source(n_source,2),&
           &z_source(n_source,2)
    double precision::x_coordinate(n_coordinate),&
           &z_coordinate(n_coordinate)
    double precision::x12,z12
    double precision::x,z,a
    double precision::r,delt_g
    double precision::g2=6.672*1e-2 !单位换算后，用的是gu


    g1=0.0;
!	!$omp parallel
!    !$omp do private(k) schedule(guided)
    do k=1,n_coordinate,1
        do i=1,2,1
          do j=1,2,1
              x12=x_source(n,i);
              z12=z_source(n,j);
              x=x_coordinate(k);
              z=z_coordinate(k);

              delt_g=g2*( (x12-x)*log( (x12-x)**2+(z12-z)**2 )+&
                     &2.0*(z12-z)*atan((x12-x)/(z12-z)) );

              g1(k)=g1(k)+((-1)**(i+j))*delt_g;
         enddo
       enddo
    enddo
!    !$omp end do
!    !$omp end parallel


    return
    end	subroutine computation_G_g_Column


    !----------------------------------------------------
    !
    !   行核函数：n_source
    !
    !----------------------------------------------------
    Subroutine computation_G_mag_Row(&
           &G,n_source,x_source,z_source,&
           &x,z,B0,tz,tx,az,ax)
    implicit none


    integer n_source
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::x,z
    double precision::G(n_source)
    double precision::tx,tz,ax,az,B0
    integer k,n,i,j,l
    double precision::PI,t
    double precision::x1,x2,z1,z2,ra,rb,rc,rd,fa,fb,fc,fd,c,s


    PI=3.1415926;
    t=2.0e2;    !磁力常数参数
    G=0.0;

!    !$omp parallel
!    !$omp do private(n) schedule(guided)
    do n=1,n_source,1

        x1=x_source(n,1);x2=x_source(n,2);
        z1=z_source(n,1);z2=z_source(n,2);

        ra=sqrt( (x-x1)**2+z1**2 );
        rb=sqrt( (x-x2)**2+z1**2 );
        rc=sqrt( (x-x1)**2+z2**2 );
        rd=sqrt( (x-x2)**2+z2**2 );

        fa=atan( z1/(x-x1) );
        fb=atan( z1/(x-x2) );
        fc=atan( z2/(x-x1) );
        fd=atan( z2/(x-x2) );

!		c=cosd( -90.0+2.0*az );
!		s=sind( -90.0+2.0*az );
!
!        G(n)=G(n)+t*((sind(tz))/(sind(az)))*( c*log((rb*rc)/(ra*rd))-&
!             &s*((fa-fb)-(fc-fd)) );

        c=0.0;  s=0.0;
        c=cos( (2.0*az-90.0)*PI/180.0 );
		s=sin( (2.0*az-90.0)*PI/180.0 );
		G(n)=G(n)+&
		 &t*( (sin(tz*PI/180.0))/(sin(az*PI/180.0)) )*( c*log((rb*rc)/(ra*rd))-&
		 &s*( (fa-fb)-(fc-fd) ) );

!        write(*,*)G(n)
    enddo
!    !$omp end do
!    !$omp end parallel


    return
    End subroutine computation_G_mag_Row


    !----------------------------------------------------
    !
    !   列核函数：n_coordinate
    !
    !----------------------------------------------------
    Subroutine computation_G_mag_Column(&
           &G,n_coordinate,n_source,n,x_source,z_source,&
           &x_coordinate,z_coordinate,B0,tz,tx,az,ax)
    implicit none


    integer n_source,n_coordinate,n
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::x_coordinate(n_coordinate),z_coordinate(n_coordinate)
    double precision::x,z
    double precision::G(n_coordinate)
    double precision::tx,tz,ax,az,B0
    integer k
    double precision::x1,x2,z1,z2,ra,rb,rc,rd,fa,fb,fc,fd,c,s
    double precision::PI,t
    double precision::delt


    PI=3.1415926;
    t=2.0e2;    !磁力常数参数
    G=0.0;

    x1=x_source(n,1);
    x2=x_source(n,2);
    z1=z_source(n,1);
    z2=z_source(n,2);


!    !$omp parallel
!    !$omp do private(k) schedule(guided)
    do k=1,n_coordinate,1

        x=x_coordinate(k);z=z_coordinate(k);

        ra=sqrt( (x-x1)**2+z1**2 );
        rb=sqrt( (x-x2)**2+z1**2 );
        rc=sqrt( (x-x1)**2+z2**2 );
        rd=sqrt( (x-x2)**2+z2**2 );

        fa=atan( z1/(x-x1) );
        fb=atan( z1/(x-x2) );
        fc=atan( z2/(x-x1) );
        fd=atan( z2/(x-x2) );

!		c=cosd( -90.0+2.0*az );
!		s=sind( -90.0+2.0*az );
!
!		delt=0.0;
!		delt=t*( (sind(tz))/(sind(az)) )*( c*log((rb*rc)/(ra*rd))-&
!			&s*( (fa-fb)-(fc-fd) ) );
!        G(k)=delt;

        c=0.0;  s=0.0;
        c=cos( (2.0*az-90.0)*PI/180.0 );
		s=sin( (2.0*az-90.0)*PI/180.0 );
		G(k)=&
		&t*( (sin(tz*PI/180.0))/(sin(az*PI/180.0)) )*( c*log((rb*rc)/(ra*rd))-&
		&s*( (fa-fb)-(fc-fd) ) );

    enddo
!    !$omp end do
!    !$omp end parallel


    return
    End subroutine computation_G_mag_Column


    !----------------------------------------------------------------------
    !
    !  模块功能：基于共轭梯度法实现重力三维物性反演
    !  参考文献：高秀鹤博士论文
    !            共轭梯度法参看秦朋波博士论文
    !
    !------------------------------------------------------------------------
    !
    !  功能：实现共轭梯度方法的重力反演
    !
    !----------------------------------------------------------------------
    Subroutine CG_triple_reweight_g(&
           &m1,mref,d_obs,wd,w,lu,&
           &cengshu,poufen_parame,as,ax,az,ws,ww,&
           &n_source,n_coordinate,x_source,z_source,&
           &x_coordinate,z_coordinate,b_low,b_up,iteration_max)
    implicit none


    character*80 filename
    integer k,n,i,j,l,kk,iteration_max
    integer n_source,n_coordinate,cengshu
    integer poufen_parame(cengshu)
    double precision::ax,as,az,ww,ws
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::x_coordinate(n_coordinate),z_coordinate(n_coordinate)
    double precision::wd(n_coordinate),w(n_source)
    double precision::m1(n_source),mref(n_source),m1_w(n_source),mref_w(n_source)
    double precision::d_obs(n_coordinate)
    double precision::lu
    double precision::eps,pl1,fd1,fd2,fm
    double precision::b1,b,b_low,b_up
    double precision,allocatable::d_pre(:)
    !梯度
    double precision::f(n_source),f0(n_source)
    !搜索方向
    double precision::d(n_source)
    !搜索步长
    double precision::del_g
    double precision::t0,t1,t2



    pl1=2.0;
    eps=2.0e-1;
!    m1=0.01;
    kk=0;
    write(*,*)'kk=',kk;
    lu=0.0;
    write(*,*)'lu',lu;
    write(*,*)


    call cpu_time(t1);
    call reweight_m(&
        &n_source,m1,w,m1_w);


	call reweight_m(&
	    &n_source,mref,w,mref_w);


    call computation_gradient_re_g(&
        &f,m1,mref,d_obs,wd,w,lu,&
        &cengshu,poufen_parame,as,ax,az,ws,ww,&
        &n_coordinate,n_source,x_source,z_source,&
        &x_coordinate,z_coordinate);


    d=-f;


    call computation_del_re_g(&
        &del_g,f,d,wd,w,lu,&
        &cengshu,poufen_parame,as,ax,az,ws,ww,&
        &n_coordinate,n_source,x_source,z_source,&
        &x_coordinate,z_coordinate);
    write(*,*)'del_g=',del_g;


    m1_w=m1_w+del_g*d;


    call Anti_reweighting_m(&
		&n_source,m1_w,w,m1);


    call positive_define_constrain(&
        &n_source,m1,b_low,b_up );


	call data_value1_g(&
		&wd,fd1,m1,d_obs,&
		&n_coordinate,n_source,x_source,z_source,&
		&x_coordinate,z_coordinate);


    call computation_module_valaue_re(&
        &x_source,z_source,n_source,cengshu,&
        &poufen_parame,as,ax,az,ws,ww,&
        &n_coordinate,w,(m1_w-mref_w),fm);


    lu=fd1/fm;
    write(*,*)'lu',lu,fd1,fm;
    pl1=fd1;
    write(*,*) 'gravity_data_value',fd1;
    write(*,*)


    do while( (pl1.ge.2.0e-1).and.(kk.lt.iteration_max) )


        kk=kk+1;
        write(*,*)'kk=',kk;


        f0=f;


        !update regularized parameter
        lu=lu*0.9;
        write(*,*)'lu=',lu;


        call reweight_m(&
            &n_source,m1,w,m1_w);


        call computation_gradient_re_g(&
            &f,m1,mref,d_obs,wd,w,lu,&
            &cengshu,poufen_parame,as,ax,az,ws,ww,&
            &n_coordinate,n_source,x_source,z_source,&
            &x_coordinate,z_coordinate);


        call update_search_d(&
            &n_source,d,f0,f);


        call computation_del_re_g(&
            &del_g,f,d,wd,w,lu,&
            &cengshu,poufen_parame,as,ax,az,ws,ww,&
            &n_coordinate,n_source,x_source,z_source,&
            &x_coordinate,z_coordinate);
        write(*,*)'del_g=',del_g;


        m1_w=m1_w+del_g*d;


        call Anti_reweighting_m(&
            &n_source,m1_w,w,m1);

        call positive_define_constrain(&
            &n_source,m1,b_low,b_up);


	    call data_value1_g(&
		    &wd,fd1,m1,d_obs,&
		    &n_coordinate,n_source,x_source,z_source,&
		    &x_coordinate,z_coordinate);
        write(*,*)'gravity_data_value=',fd1;
        write(*,*)
        pl1=fd1;


    enddo
    call cpu_time(t2);
    write(*,*)'The time required for gravity inversion:',t2-t1,'s';
    write(*,*)'-------------------------------------------------------------';


    return
    End subroutine CG_triple_reweight_g


    !----------------------------------------------------------------------
    !
    !   功能：实现共轭梯度方法的重力反演
    !
    !----------------------------------------------------------------------
    Subroutine CG_triple_reweight_m(&
           &m1,mref,d_obs,wd,w,lu,&
           &cengshu,poufen_parame,as,ax,az,ws,ww,&
           &n_source,n_coordinate,x_source,z_source,&
           &x_coordinate,z_coordinate,&
           &tx,tz,ax1,az1,B0,b_low,b_up,iteration_max)
    implicit none


    character*80 filename
    integer k,n,i,j,l,kk,iteration_max
    integer n_source,n_coordinate,cengshu
    integer poufen_parame(cengshu)
    double precision::ax,as,az,ww,ws
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::x_coordinate(n_coordinate),z_coordinate(n_coordinate)
    double precision::wd(n_coordinate),w(n_source)
    double precision::tx,tz,ax1,az1,B0
    double precision::m1(n_source),mref(n_source),m1_w(n_source),mref_w(n_source)
    double precision::d_obs(n_coordinate)
    double precision::lu
    double precision::eps,pl1,fd1,fd2,fm
    double precision::b1,b,b_low,b_up
    double precision,allocatable::d_pre(:)
    !梯度
    double precision::f(n_source),f0(n_source)
    !搜索方向
    double precision::d(n_source)
    !搜索步长
    double precision::del_m
    double precision::t1,t2



    pl1=2.0;
    eps=2.0e-1;
!    m1=0.01;


    kk=0;
    write(*,*)'kk=',kk;
    lu=0.0;
    write(*,*)'lu',lu;
    write(*,*)


    call cpu_time(t1);
    call reweight_m(&
        &n_source,m1,w,m1_w);


	call reweight_m(&
	    &n_source,mref,w,mref_w);


	call computation_gradient_re_m(&
		&f,m1,mref,d_obs,wd,w,lu,&
		&cengshu,poufen_parame,as,ax,az,ws,ww,&
		&n_coordinate,n_source,x_source,z_source,&
		&x_coordinate,z_coordinate,B0,tz,tx,az1,ax1);


    d=-f;


	call computation_del_re_m(&
		&del_m,f,d,wd,w,lu,&
		&cengshu,poufen_parame,as,ax,az,ws,ww,&
		&n_coordinate,n_source,x_source,z_source,&
		&x_coordinate,z_coordinate,B0,tz,tx,az1,ax1);
    write(*,*)'del_m=',del_m;


    m1_w=m1_w+del_m*d;


    call Anti_reweighting_m(&
        &n_source,m1_w,w,m1);


	call positive_define_constrain(&
	    &n_source,m1,b_low,b_up);


    call data_value1_m(&
		&wd,fd1,m1,d_obs,&
		&n_coordinate,n_source,x_source,z_source,&
		&x_coordinate,z_coordinate,B0,tz,tx,az1,ax1);


    call computation_module_valaue_re(&
        &x_source,z_source,n_source,cengshu,&
        &poufen_parame,as,ax,az,ws,ww,&
        &n_coordinate,w,(m1_w-mref_w),fm);


    lu=fd1/fm;


    write(*,*)'lu',lu,fd1,fm;
    pl1=fd1;
    write(*,*)'magnetic_data_value',fd1;
    write(*,*)




    do while( (pl1.ge.2.0e-1).and.(kk.lt.iteration_max) )


        kk=kk+1;
        write(*,*)kk;


        f0=f;


        !update regularized parameter
        lu=lu*0.9;
        write(*,*)'lu=',lu;


        call reweight_m(&
            &n_source,m1,w,m1_w);


	    call computation_gradient_re_m(&
		    &f,m1,mref,d_obs,wd,w,lu,&
		    &cengshu,poufen_parame,as,ax,az,ws,ww,&
		    &n_coordinate,n_source,x_source,z_source,&
		    &x_coordinate,z_coordinate,B0,tz,tx,az1,ax1);


        call update_search_d(&
            &n_source,d,f0,f);


        call computation_del_re_m(&
            &del_m,f,d,wd,w,lu,&
            &cengshu,poufen_parame,as,ax,az,ws,ww,&
            &n_coordinate,n_source,x_source,z_source,&
            &x_coordinate,z_coordinate,B0,tz,tx,az1,ax1);
        write(*,*)'del_m=',del_m;


        m1_w=m1_w+del_m*d;


        call Anti_reweighting_m(&
            &n_source,m1_w,w,m1);


        call positive_define_constrain(&
            &n_source,m1,b_low,b_up);


		call data_value1_m(&
			&wd,fd1,m1,d_obs,&
			&n_coordinate,n_source,x_source,z_source,&
			&x_coordinate,z_coordinate,B0,tz,tx,az1,ax1);
        write(*,*)  'magnetic_data_value=',fd1;
        write(*,*)
        pl1=fd1;


    enddo


    call  cpu_time(t2);
    write(*,*) 'The time required for magnetic inversion:',t2-t1,'s';
    write(*,*) '-------------------------------------------------------------';


    return
    End subroutine CG_triple_reweight_m


    !----------------------------------------------------------------------
    !
    !  功能：计算数据目标函数的梯度
    !   f=G'*Wd'*Wd*(G*m1-d_obs)+β*Wm'*Wm*(m1-mref)
    !   f_w = G_w'*Wd'*Wd*(G_w*m1_w-d_obs) + β*Wm_w'*Wm_w*(m1_w-mref_w)
    !          = (w-1)'*[G'*Wd'*Wd*(G*m1-d_obs)] + β*[Wm_w'*Wm_w*(m1_w-mref_w)]
    !
    !------------------------------------------------------------------------
    Subroutine computation_gradient_re_g(&
           &f_w,m1,mref,d_obs,wd,w,lu,&
           &cengshu,poufen_parame,as,ax,az,ws,ww,&
           &n_coordinate,n_source,x_source,z_source,&
           &x_coordinate,z_coordinate)
    implicit none


    integer k,n,i,j,l
    integer n_source,n_coordinate,cengshu
    integer poufen_parame(cengshu)
    double precision::ax,as,az,ww,ws
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::x_coordinate(n_coordinate),z_coordinate(n_coordinate)
    double precision::x,y,z,lu
    double precision::wd(n_coordinate),w(n_source)
    double precision::m1(n_source),mref(n_source),d_obs(n_coordinate)
    double precision::f_w(n_source)
    double precision,allocatable::d_pre(:),d_delt(:),g2(:),g11(:),g11_w(:),&
            &g12_w(:),wwd(:),m1_w(:),mref_w(:)


    allocate(d_pre(n_coordinate))
    d_pre=0.0;
    call computation_d_pre_g(&
		&d_pre,m1,&
		&n_coordinate,n_source,x_source,z_source,&
		&x_coordinate,z_coordinate);


	allocate(d_delt(n_coordinate));
	d_delt=0.0;
    d_delt=d_pre-d_obs;
    deallocate(d_pre);


    allocate(wwd(n_coordinate));
    wwd=0.0;
    !$acc kernels
    do i=1,n_coordinate,1
        wwd(i)=wd(i)*wd(i)*d_delt(i);
    enddo
    !$acc end kernels
    deallocate(d_delt);


    allocate(g2(n_coordinate),g11(n_source));
    g11=0.0;
    do j=1,n_source,1
        g2=0.0;
        call computation_G_g_Column(&
            &g2,n_coordinate,n_source,j,x_source,z_source,&
            &x_coordinate,z_coordinate);

        do i=1,n_coordinate,1
            g11(j)=g11(j)+g2(i)*wwd(i);
        enddo
    enddo
    deallocate(wwd,g2);


    !重加权计算：(w-1)'*[G'*Wd'*Wd*(G*m1 - d_obs)]
    allocate(g11_w(n_source));
    g11_w=0.0;
    do i=1,n_source,1
        g11_w(i)=g11(i)/w(i);
    enddo
    deallocate(g11);


    allocate(g12_w(n_source),m1_w(n_source),mref_w(n_source));
    g12_w=0.0;
    call reweight_m(n_source,m1,w,m1_w);
	call reweight_m(n_source,mref,w,mref_w);
	!计算：Wm_w'*Wm_w*(m1_w - mref_w)
    call computation_WWm_re(&
        &x_source,z_source,n_source,cengshu,&
        &poufen_parame,as,ax,az,ws,ww,&
        &n_coordinate,w,(m1_w-mref_w),g12_w);
    deallocate(m1_w,mref_w);


    f_w=0.0;
    f_w=g11_w+lu*g12_w;
    deallocate(g11_w,g12_w);


    return
    End subroutine computation_gradient_re_g


    !------------------------------------------------------------------------
    !
    !  功能：计算迭代过程中的搜索方向
    !  输入参数说明：
    !    n_source,n_coordinate：物性参数个数
    !    G,d_obs,mref,lu
    !   f0：上一次迭代的梯度
    !    d：搜索方向
    !
    !  输出参数说明：
    !    d：搜索方向
    !    β(k-1)=g(k)*(g(k)-g(k-1))/(g(k-1)*g(k-1));
    !    d(k)=-g(k)+β(k-1)*d(k-1);
    !
    !------------------------------------------------------------------------
    Subroutine update_search_d(&
		   &n_source,d,f0,f)
    implicit none


    integer n_source
    double precision::f0(n_source),f(n_source)
    double precision::d(n_source)
    double precision::b,b1
    integer j


    !beta     Polak-Ribiere
    b=0.0;  b1=0.0;
    !$acc parallel
    !$acc loop reduction (+:b)
    do j=1,n_source,1
       b = b + f(j)*( f(j) - f0(j) );
    enddo
    !$acc end loop
    !$acc end parallel

    !$acc parallel
    !$acc loop reduction (+:b1)
    do j=1,n_source,1
       b1 = b1 + f0(j)*f0(j);
    enddo
    !$acc end loop
    !$acc end parallel
    b=b/b1;

    !搜索方向
    d=-f+b*d;


    return
    End subroutine update_search_d


    !----------------------------------------------------------------------
    !
    !   功能：计算步长：α=-(dk'*f)/(dk'*A*dk)
    !
    !------------------------------------------------------------------------
    Subroutine computation_del_re_g(&
           &del_g,f,d,wd,w,lu,&
           &cengshu,poufen_parame,as,ax,az,ws,ww,&
           &n_coordinate,n_source,x_source,z_source,&
           &x_coordinate,z_coordinate)
    implicit none

    integer k,n,i,j,l
    integer n_source,n_coordinate,cengshu
    integer poufen_parame(cengshu)
    double precision::ax,as,az,ww,ws
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::x_coordinate(n_coordinate),z_coordinate(n_coordinate)
    double precision::x,z,lu
    double precision::wd(n_coordinate),w(n_source)
    double precision::d(n_source),f(n_source)
    double precision::b_w,b1,del_g


    b_w=0.0;
    call computation_dAd_re_g(&
        &b_w,d,wd,w,lu,&
        &cengshu,poufen_parame,as,ax,az,ws,ww,&
        &n_coordinate,n_source,x_source,z_source,&
        &x_coordinate,z_coordinate);


    b1=0.0;
    !$acc parallel
    !$acc loop reduction (+:b1)
    do i=1,n_source,1
       b1=b1+(-f(i))*d(i);
    enddo
    !$acc end loop
    !$acc end parallel
    del_g=b1/b_w;


    return
    End subroutine computation_del_re_g


    !----------------------------------------------------------------------
    !
    !  功能：计算步长计算中间量：分母dk'*A*dk = dk'*A_w*dk
    !     = dk'*(G_w'*Wd'*Wd*G_w)*dk +β*dk'*(Wm_w'* Wm_w)*dk
    !                                  (Wd*G*dk_w)^2
    !------------------------------------------------------------------------
    Subroutine computation_dAd_re_g(&
           &b_w,d,wd,w,lu,&
           &cengshu,poufen_parame,as,ax,az,ws,ww,&
           &n_coordinate,n_source,x_source,z_source,&
           &x_coordinate,z_coordinate)
    implicit none

    integer k,n,i,j,l
    integer n_source,n_coordinate,cengshu
    integer poufen_parame(cengshu)
    double precision::ax,as,az,ww,ws
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::x_coordinate(n_coordinate),z_coordinate(n_coordinate)
    double precision::x,z,lu
    double precision::wd(n_coordinate),w(n_source)
    double precision::d(n_source),dggd,dwwd,b_w
    double precision,allocatable::d_w(:),gd(:),g1(:),wgd(:)


    !计算dk_w
    allocate(d_w(n_source));
    d_w=0.0;
    !$acc kernels
    do i=1,n_source,1
        d_w(i)=d(i)/w(i);
    enddo
    !$acc end kernels


    allocate(gd(n_coordinate),g1(n_source))
    gd=0.0;
    do i=1,n_coordinate,1
        x=x_coordinate(i);  z=z_coordinate(i);
        g1=0.0;
        call computation_G_g_Row(&
            &g1,n_source,x_source,z_source,x,z);

        do j=1,n_source,1
            gd(i)=gd(i)+g1(j)*d_w(j);
        enddo
    enddo
    deallocate(g1,d_w);


    allocate(wgd(n_coordinate));
    wgd=0.0;
    !$acc kernels
    do i=1,n_coordinate,1
        wgd(i)=wd(i)*gd(i);
    enddo
    !$acc end kernels
    deallocate(gd);


    dggd=0.0;
    !$acc parallel
    !$acc loop reduction (+:dggd)
    do i=1,n_coordinate,1
        dggd=dggd+wgd(i)**2;
    enddo
    !$acc end loop
    !$acc end parallel
    deallocate(wgd);


    !计算(Wm_w*dk)^2
    dwwd=0.0;
    call computation_module_valaue_re(&
        &x_source,z_source,n_source,cengshu,&
        &poufen_parame,as,ax,az,ws,ww,&
        &n_coordinate,w,d,dwwd);

    b_w=0.0;
    b_w=dggd+lu*dwwd;


    return
    End subroutine computation_dAd_re_g


    !----------------------------------------------------------------------
    !
    !   功能：计算重力异常值：d_pre = G*m1
    !
    !------------------------------------------------------------------------
    Subroutine computation_d_pre_g(&
           &d_pre,m1,&
           &n_coordinate,n_source,x_source,z_source,&
           &x_coordinate,z_coordinate)
    implicit none

    integer k,n,i,j,l
    integer n_source,n_coordinate
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::x_coordinate(n_coordinate),z_coordinate(n_coordinate)
    double precision::x,z
    double precision::m1(n_source),d_pre(n_coordinate)
    double precision,allocatable::g1(:)


    allocate(g1(n_source))
    d_pre=0.0;
    do i=1,n_coordinate,1
        x=x_coordinate(i);
        z=z_coordinate(i);
        g1=0.0;
        call computation_G_g_Row(&
            &g1,n_source,x_source,z_source,x,z)

        do j=1,n_source,1
            d_pre(i)=d_pre(i)+g1(j)*m1(j);
        enddo
    enddo
    deallocate(g1);


    return
    End subroutine  computation_d_pre_g


    !----------------------------------------------------------------------
    !
    !  功能：计算目标数据值：fd = [ Wd*( d_pre - d_obs ) ]^2
    !
    !------------------------------------------------------------------------
    Subroutine data_value1_g(&
           &wd,data_value,m1,d_obs,&
           &n_coordinate,n_source,x_source,z_source,&
           &x_coordinate,z_coordinate)
    implicit none

    integer k,n,i,j,l
    integer n_source,n_coordinate
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::x_coordinate(n_coordinate),z_coordinate(n_coordinate)
    double precision::wd(n_coordinate)
    double precision::m1(n_source),d_obs(n_coordinate),data_value
    double precision,allocatable::d_pre(:),d_delt(:)


    allocate(d_pre(n_coordinate))
    d_pre=0.0;
    call computation_d_pre_g(&
        &d_pre,m1,n_coordinate,n_source,x_source,z_source,&
        &x_coordinate,z_coordinate);


    allocate(d_delt(n_coordinate))
    d_delt=0.0;
    d_delt=d_pre-d_obs;
    deallocate(d_pre);


    data_value=0.0;
    !$acc parallel
    !$acc loop reduction(+:data_value)
    do i=1,n_coordinate,1
        data_value=data_value+(d_delt(i)*wd(i))**2;
    enddo
    !$acc end loop
    !$acc end parallel
    deallocate(d_delt);


    return
    End subroutine  data_value1_g


    !------------------------------------------------------------------------
    !
    !   功能：计算梯度
    !   f=G'*Wd'*Wd*(G*m1-d_obs)+β*Wm'*Wm*(m1-mref)
    !   f_w = G_w'*Wd'*Wd*(G_w*m1_w-d_obs) + β*Wm_w'*Wm_w*(m1_w-mref_w)
    !          = (w-1)'*[G'*Wd'*Wd*(G*m1-d_obs)] + β*[Wm_w'*Wm_w*(m1_w-mref_w)]
    !
    !------------------------------------------------------------------------
    Subroutine computation_gradient_re_m(&
           &f_w,m1,mref,d_obs,wd,w,lu,&
           &cengshu,poufen_parame,as,ax,az,ws,ww,&
           &n_coordinate,n_source,x_source,z_source,&
           &x_coordinate,z_coordinate,B0,tz,tx,az1,ax1)
    implicit none

    integer k,n,i,j,l
    integer n_source,n_coordinate,cengshu
    integer poufen_parame(cengshu)
    double precision::ax,as,az,ww,ws
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::x_coordinate(n_coordinate),z_coordinate(n_coordinate)
    double precision::x,z,lu
    double precision::tx,tz,ax1,az1,B0
    double precision::m1(n_source),mref(n_source)
    double precision::wd(n_coordinate),w(n_source),d_obs(n_coordinate)
    double precision::f_w(n_source)
    double precision,allocatable::d_pre(:),d_delt(:),g2(:),g11(:),g11_w(:),&
            &wwd(:),g12_w(:),m1_w(:),mref_w(:)


    allocate(d_pre(n_coordinate))
    d_pre=0.0;
    call computation_d_pre_m(&
		&d_pre,m1,&
		&n_coordinate,n_source,x_source,z_source,&
		&x_coordinate,z_coordinate,B0,tz,tx,az1,ax1);


    allocate(d_delt(n_coordinate));
    d_delt=0.0;
    d_delt=d_pre-d_obs;
    deallocate(d_pre);


    allocate(wwd(n_coordinate));
    wwd=0.0;
    !$acc kernels
    do i=1,n_coordinate,1
        wwd(i)=wd(i)*wd(i)*d_delt(i);
    enddo
    !$acc end kernels
    deallocate(d_delt);


    allocate(g2(n_coordinate),g11(n_source))
    g11=0.0;
    do j=1,n_source,1
        g2=0.0;
        call computation_G_mag_Column(&
            &g2,n_coordinate,n_source,j,x_source,z_source,&
            &x_coordinate,z_coordinate,B0,tz,tx,az1,ax1);

        do i=1,n_coordinate,1
            g11(j)=g11(j)+g2(i)*wwd(i);
        enddo
    enddo
    deallocate(wwd,g2);


    !重加权计算：(w-1)'*[G'*Wd'*Wd*(G*m1 - d_obs)]
    allocate(g11_w(n_source));
    g11_w=0.0;
    do i=1,n_source,1
        g11_w(i)=g11(i)/w(i);
    enddo
    deallocate(g11);


    allocate(g12_w(n_source),m1_w(n_source),mref_w(n_source));
    g12_w=0.0;

    call reweight_m(&
        &n_source,m1,w,m1_w);


	call reweight_m(&
	    &n_source,mref,w,mref_w);


	!计算：Wm_w'*Wm_w*(m1_w-mref_w)
    call computation_WWm_re(&
        &x_source,z_source,n_source,cengshu,&
        &poufen_parame,as,ax,az,ws,ww,&
        &n_coordinate,w,(m1_w-mref_w),g12_w);
    deallocate(m1_w,mref_w);


    f_w=g11_w+lu*g12_w;
    deallocate(g11_w,g12_w);

    return
    End subroutine computation_gradient_re_m


    !----------------------------------------------------------------------
    !
    !   计算步长：α = - (dk'*f)/(dk'*A_w*dk)
    !
    !------------------------------------------------------------------------
    Subroutine computation_del_re_m( &
           &del_m,f,d,wd,w,lu,&
           &cengshu,poufen_parame,as,ax,az,ws,ww,&
           &n_coordinate,n_source,x_source,z_source,&
           &x_coordinate,z_coordinate,B0,tz,tx,az1,ax1 )
    implicit none


    integer k,n,i,j,l
    integer n_source,n_coordinate,cengshu
    integer poufen_parame(cengshu)
    double precision::ax,as,az,ww,ws
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::x_coordinate(n_coordinate),z_coordinate(n_coordinate)
    double precision::x,z,lu
    double precision::B0,tz,tx,az1,ax1
    double precision::wd(n_coordinate),w(n_source)
    double precision::d(n_source),f(n_source)
    double precision::b_w,b1,del_m


    b_w=0.0;
    call computation_dAd_re_m(&
        &b_w,d,wd,w,lu,&
        &cengshu,poufen_parame,as,ax,az,ws,ww,&
        &n_coordinate,n_source,x_source,z_source,&
        &x_coordinate,z_coordinate,B0,tz,tx,az1,ax1);

    b1=0.0;
    !$acc parallel
    !$acc loop reduction (+:b1)
    do i=1,n_source,1
       b1=b1+(-f(i))*d(i);
    enddo
    !$acc end loop
    !$acc end parallel
    del_m=b1/b_w;


    return
    End subroutine computation_del_re_m


    !----------------------------------------------------------------------
    !
    !  功能：计算步长计算中间量：分母dk*A*dk = dk'*A_w*dk
    !     =dk'*(G_w'*Wd'*Wd*G_w)*dk + β*dk'*(Wm_w'*Wm_w)*dk
    !                                 (Wd*G*dk_w)^2
    !------------------------------------------------------------------------
    Subroutine computation_dAd_re_m(&
           &b_w,d,wd,w,lu,&
           &cengshu,poufen_parame,as,ax,az,ws,ww,&
           &n_coordinate,n_source,x_source,z_source,&
           &x_coordinate,z_coordinate,B0,tz,tx,az1,ax1)
    implicit none


    integer k,n,i,j,l
    integer n_source,n_coordinate,cengshu
    integer poufen_parame(cengshu)
    double precision::ax,as,az,ww,ws
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::x_coordinate(n_coordinate),z_coordinate(n_coordinate)
    double precision::x,z,lu
    double precision::B0,tz,tx,az1,ax1
    double precision::wd(n_coordinate),w(n_source)
    double precision::d(n_source),dggd,dwwd,b_w
    double precision,allocatable::d_w(:),gd(:),g1(:),wgd(:)


    !计算dk_w
    allocate(d_w(n_source));
    d_w=0.0;
    !$acc kernels
    do i=1,n_source,1
        d_w(i)=d(i)/w(i);
    enddo
    !$acc end kernels


    allocate(gd(n_coordinate),g1(n_source));
    gd=0.0;
    do i=1,n_coordinate,1
        x=x_coordinate(i);  z=z_coordinate(i);
        g1=0.0;
        call computation_G_mag_Row(&
            &g1,n_source,x_source,z_source,&
            &x,z,B0,tz,tx,az1,ax1);

        do j=1,n_source,1
            gd(i)=gd(i)+g1(j)*d_w(j);
        enddo
    enddo
    deallocate(g1,d_w);


    allocate(wgd(n_coordinate));
    wgd=0.0;
    !$acc kernels
    do i=1,n_coordinate,1
        wgd(i)=wd(i)*gd(i);
    enddo
    !$acc end kernels
    deallocate(gd);


    dggd=0.0;
    !$acc parallel
    !$acc loop reduction (+:dggd)
    do i=1,n_coordinate,1
        dggd=dggd+wgd(i)**2;
    enddo
    !$acc end loop
    !$acc end parallel
    deallocate(wgd);


    !计算(Wm_w*dk)^2
    dwwd=0.0;
    call computation_module_valaue_re(&
        &x_source,z_source,n_source,cengshu,&
        &poufen_parame,as,ax,az,ws,ww,&
        &n_coordinate,w,d,dwwd);

    b_w=dggd+lu*dwwd;


    return
    End subroutine computation_dAd_re_m


    !----------------------------------------------------------------------
    !
    !   功能：计算重力异常值：d_pre = G*m2
    !
    !------------------------------------------------------------------------
    Subroutine computation_d_pre_m(&
           &d_pre,m1,&
           &n_coordinate,n_source,x_source,z_source,&
           &x_coordinate,z_coordinate,B0,tz,tx,az1,ax1)
    implicit none


    integer k,n,i,j,l
    integer n_source,n_coordinate
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::x_coordinate(n_coordinate),z_coordinate(n_coordinate)
    double precision::x,z
    double precision::B0,tz,tx,az1,ax1
    double precision::m1(n_source),d_pre(n_coordinate)
    double precision,allocatable::g1(:)


    allocate(g1(n_source))
    d_pre=0.0;
    do i=1,n_coordinate,1
        x=x_coordinate(i);
        z=z_coordinate(i);
        g1=0.0;
        call computation_G_mag_Row(&
            &g1,n_source,x_source,z_source,&
            &x,z,B0,tz,tx,az1,ax1);

        do j=1,n_source,1
            d_pre(i)=d_pre(i)+g1(j)*m1(j);
        enddo
    enddo
    deallocate(g1);


    return
    End subroutine  computation_d_pre_m


    !----------------------------------------------------------------------
    !
    !  功能：计算目标数据值：fd = [ Wd*(d_pre-d_obs) ]^2
    !
    !------------------------------------------------------------------------
    Subroutine data_value1_m(&
           &wd,data_value,m1,d_obs,&
           &n_coordinate,n_source,x_source,z_source,&
           &x_coordinate,z_coordinate,B0,tz,tx,az1,ax1)
    implicit none

    integer k,n,i,j,l
    integer n_source,n_coordinate
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::x_coordinate(n_coordinate),z_coordinate(n_coordinate)
    double precision::wd(n_coordinate)
    double precision::B0,tz,tx,az1,ax1
    double precision::m1(n_source),d_obs(n_coordinate),data_value
    double precision,allocatable::d_pre(:),d_delt(:)


    allocate(d_pre(n_coordinate))
    d_pre=0.0;
    call computation_d_pre_m(&
        &d_pre,m1,&
        &n_coordinate,n_source,x_source,z_source,&
        &x_coordinate,z_coordinate,B0,tz,tx,az1,ax1);


    allocate(d_delt(n_coordinate))
    d_delt=0.0;
    d_delt=d_pre-d_obs;
    deallocate(d_pre);


    data_value=0.0;
    !$acc parallel
    !$acc loop reduction(+:data_value)
    do i=1,n_coordinate,1
        data_value=data_value+(d_delt(i)*wd(i))**2;
    enddo
    !$acc end loop
    !$acc end parallel
    deallocate(d_delt);


    return
    End subroutine data_value1_m


    !------------------------------------------------------------------------
    !
    !  功能：模糊聚类重磁力联合反演
    !
    !  输入参数说明：
    !           mref_g,mref_m：模型物性参数参考模型
    !               m1_g,m1_m：计算得到的物性参数参考模型
    !               lu_g,lu_m：正则化加权参数
    !                 G_g,G_m：核函数
    !         d_obs_g,d_obs_m：原始异常数据矩阵
    !               wd_g,wd_m：数据约束项加权矩阵
    !                 w_m,w_g：深度加权矩阵
    !   n_source,n_coordinate：物性参数个数
    !                       C：聚类类别数
    !                      V2：初始聚类中心矩阵
    !               wm_g,wm_m：光滑约束矩阵
    !    target_data_misfit_g：目标数据约束项值m1
    !    target_data_misfit_m：目标数据约束项值m2
    !
    !------------------------------------------------------------------------
    Subroutine  fcrm_triple_2D_joint_inversion(&
        &m1_g,mref_g,d_obs_g,wd_g,w_g,lu_g,&
        &m1_m,mref_m,d_obs_m,wd_m,w_m,lu_m,&
        &cengshu,poufen_parame,&
        &as_g,ax_g,az_g,ws_g,ww_g,&
        &as_m,ax_m,az_m,ws_m,ww_m,&
        &C,n_source,n_coordinate,&
        &x_source,z_source,&
        &x_coordinate,z_coordinate,&
        &tx,tz,ax1,az1,B0,lambda_g,lambda_m,eta_g,eta_m,&
        &b_low_g,b_up_g,b_low_m,b_up_m,iteration_max_joint,V,tk)
    implicit none


    character*80 filename
    integer n_source,n_coordinate
    integer C,cengshu
    integer poufen_parame(cengshu,2)
    double precision::ax_g,as_g,az_g,ww_g,ws_g
    double precision::ax_m,as_m,az_m,ww_m,ws_m
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::x_coordinate(n_coordinate),z_coordinate(n_coordinate)
    double precision::tx,tz,ax1,az1,B0
    double precision::q
    double precision::tk(C,2),V(C,2)
    double precision::mref_g(n_source),m1_g(n_source)
    double precision::d_obs_g(n_coordinate),w_g(n_source)
    double precision::wd_g(n_coordinate)
    double precision::lu_g,lambda_g,eta_g
    double precision::target_data_misfit_g
    double precision,allocatable::d_pre_g(:)
    double precision::mref_m(n_source),m1_m(n_source)
    double precision::d_obs_m(n_coordinate),w_m(n_source)
    double precision::wd_m(n_coordinate)
    double precision::lu_m,lambda_m,eta_m
    double precision::target_data_misfit_m
    double precision,allocatable::d_pre_m(:)
    integer j,i,k,kk,iteration_max_joint
    double precision::eps1,eps
    double precision::pl,pl1,pl2
    double precision::fd1,fd2,fm1,fm2,fc
    double precision::b_low_g,b_up_g,b_low_m,b_up_m
    double precision,allocatable::ujk(:,:)
    double precision,allocatable::V1(:,:),V2(:,:),T1(:),T2(:)
    !梯度
    double precision::f_g(n_source),f0_g(n_source)
    double precision::f_m(n_source),f0_m(n_source)
    !搜索方向
    double precision::d_g(n_source)
    double precision::d_m(n_source)
    !搜索步长
    double precision::del_g,del_m
    double precision::t10,t20



    q=2.0;
    eps=1.0e-4;
    pl=2.0;
    pl1=20.0;
    pl2=2.0;


    write(*,*) tk
    write(*,*) V


    call cpu_time(t10);
    call data_value1_g( &
        &wd_g,fd1,m1_g,d_obs_g,&
        &n_coordinate,n_source,x_source,z_source,&
        &x_coordinate,z_coordinate);


    call computation_module_valaue(&
        &x_source,z_source,n_source,cengshu,&
        &poufen_parame,as_g,ax_g,az_g,ws_g,ww_g,&
        &n_coordinate,w_g,(m1_g-mref_g),fm1);
    lu_g = fd1/fm1;
    write(*,*)'lu_g,fd1,fm1',lu_g,fd1,fm1;
    write(*,*) 'gravity_data_value=',fd1;


    call data_value1_m( &
        &wd_m,fd2,m1_m,d_obs_m,&
        &n_coordinate,n_source,x_source,z_source,&
        &x_coordinate,z_coordinate,B0,tz,tx,az1,ax1 );


    call computation_module_valaue( &
        &x_source,z_source,n_source,cengshu,&
        &poufen_parame,as_m,ax_m,az_m,ws_m,ww_m,&
        &n_coordinate,w_m,(m1_m-mref_m),fm2 );
    lu_m = fd2/fm2;
    write(*,*)'lu_m,fd2,fm2',lu_m,fd2,fm2;
    write(*,*) 'magnetic_data_value=',fd2;




    kk=0;
    write(*,*) 'kk=',kk;

    allocate(ujk(n_source,C));
    call com_u(&
        &m1_g,m1_m,q,C,n_source,ujk,V );


    !-----------------------------------------------------------------------
    !gravity
    call update_gradient_g( &
        &cengshu,poufen_parame,as_g,ax_g,az_g,ws_g,ww_g,&
        &n_coordinate,n_source,x_source,z_source,&
        &x_coordinate,z_coordinate,&
        &m1_g,m1_m,mref_g,d_obs_g,wd_g,w_g,&
        &lu_g,lambda_g,C,V,ujk,f_g );


    d_g=-f_g;


    call update_del_m_CG_g( &
        &cengshu,poufen_parame,as_g,ax_g,az_g,ws_g,ww_g,&
        &n_coordinate,n_source,x_source,z_source,&
        &x_coordinate,z_coordinate,&
        &lu_g,lambda_g,wd_g,w_g,C,V,ujk,d_g,f_g,del_g)


    m1_g=m1_g+del_g*d_g;
    call positive_define_constrain(n_source,m1_g,b_low_g,b_up_g);



    call data_value1_g( &
        &wd_g,fd1,m1_g,d_obs_g,&
        &n_coordinate,n_source,x_source,z_source,&
        &x_coordinate,z_coordinate );
    pl1=fd1;
    write(*,*) 'gravity_data_value=',fd1;


    !------------------------------------------------------------------
    !magnetic
    call update_gradient_m( &
        &cengshu,poufen_parame,as_m,ax_m,az_m,ws_m,ww_m,&
        &n_coordinate,n_source,x_source,z_source,&
        &x_coordinate,z_coordinate,B0,tz,tx,az1,ax1,&
        &m1_g,m1_m,mref_m,d_obs_m,wd_m,w_m,&
        &lu_m,lambda_m,C,V,ujk,f_m );


    d_m=-f_m;


    call update_del_m_CG_m( &
        &cengshu,poufen_parame,as_m,ax_m,az_m,ws_m,ww_m,&
        &n_coordinate,n_source,x_source,z_source,&
        &x_coordinate,z_coordinate,B0,tz,tx,az1,ax1,&
        &lu_m,lambda_m,wd_m,w_m,C,V,ujk,d_m,f_m,del_m );


    m1_m=m1_m+del_m*d_m;


    call positive_define_constrain(&
        &n_source,m1_m,b_low_m,b_up_m);


    call data_value1_m( &
        &wd_m,fd2,m1_m,d_obs_m,&
        &n_coordinate,n_source,x_source,z_source,&
        &x_coordinate,z_coordinate,B0,tz,tx,az1,ax1 );

    pl1=fd2;
    write(*,*) 'magnetic_data_value=',fd2;
    write(12,*) kk,fd2;


    !------------------------------------------------------------------------
    call com_V( m1_g,m1_m,q,C,eta_g,eta_m,tk,n_source,ujk,V );
    write(*,*)'V=',V;
    write(*,*)


    allocate( V1(C,2),V2(C,2) );
    V1=V;
    V2=V1;
    kk=0;


    do while( ((pl1.ge.eps).or.(pl2.ge.eps)).and.(kk.lt.iteration_max_joint) )


            kk=kk+1;
            write(*,*) 'kk=',kk;


            V1=V2;


            !update membership function
            call com_u(&
                &m1_g,m1_m,q,C,n_source,ujk,V );


            !------------------------------------------------------------
            !!update density model
            f0_g=f_g;


            call update_gradient_g( &
                &cengshu,poufen_parame,as_g,ax_g,az_g,ws_g,ww_g,&
                &n_coordinate,n_source,x_source,z_source,&
                &x_coordinate,z_coordinate,&
                &m1_g,m1_m,mref_g,d_obs_g,wd_g,w_g,&
                &lu_g,lambda_g,C,V,ujk,f_g );


            call update_search_d(&
                &n_source,d_g,f0_g,f_g);


            call update_del_m_CG_g( &
                &cengshu,poufen_parame,as_g,ax_g,az_g,ws_g,ww_g,&
                &n_coordinate,n_source,x_source,z_source,&
                &x_coordinate,z_coordinate,&
                &lu_g,lambda_g,wd_g,w_g,C,V,ujk,d_g,f_g,del_g );


            m1_g = m1_g + del_g*d_g;


            call positive_define_constrain(&
                &n_source,m1_g,b_low_g,b_up_g);



            !-----------------------------------------------------------
            !!pdate magnetization model
            f0_m=f_m;


            call update_gradient_m( &
                &cengshu,poufen_parame,as_m,ax_m,az_m,ws_m,ww_m,&
                &n_coordinate,n_source,x_source,z_source,&
                &x_coordinate,z_coordinate,B0,tz,tx,az1,ax1,&
                &m1_g,m1_m,mref_m,d_obs_m,wd_m,w_m,&
                &lu_m,lambda_m,C,V,ujk,f_m )


            call update_search_d(&
                &n_source,d_m,f0_m,f_m);


            call update_del_m_CG_m( &
                &cengshu,poufen_parame,as_m,ax_m,az_m,ws_m,ww_m,&
                &n_coordinate,n_source,x_source,z_source,&
                &x_coordinate,z_coordinate,B0,tz,tx,az1,ax1,&
                &lu_m,lambda_m,wd_m,w_m,C,V,ujk,d_m,f_m,del_m );


            m1_m = m1_m + del_m*d_m;


            call positive_define_constrain(&
                &n_source,m1_m,b_low_m,b_up_m);



            !-------------------------------------------------------------------
            !update cluster centers
            call com_v(&
                &m1_g,m1_m,q,C,eta_g,eta_m,tk,n_source,ujk,V );
            write(*,*) 'cluster center:'
            write(*,*) V
            V2=V;


            call update_guide_weighting_parameter(&
                &V1,V2,C,tk,eta_g,eta_m);
            write(*,*)'eta_g=',eta_g;
            write(*,*)'eta_m=',eta_m;


            call data_value1_g( &
                &wd_g,Fd1,m1_g,d_obs_g,&
                &n_coordinate,n_source,x_source,z_source,&
                &x_coordinate,z_coordinate );


            call data_value1_m( &
                &wd_m,Fd2,m1_m,d_obs_m,&
                &n_coordinate,n_source,x_source,z_source,&
                &x_coordinate,z_coordinate,B0,tz,tx,az1,ax1 );


            call computation_module_valaue( &
                &x_source,z_source,n_source,cengshu,&
                &poufen_parame,as_g,ax_g,az_g,ws_g,ww_g,&
                &n_coordinate,w_g,(m1_g-mref_g),fm1 );


            call computation_module_valaue( &
                &x_source,z_source,n_source,cengshu,&
                &poufen_parame,as_m,ax_m,az_m,ws_m,ww_m,&
                &n_coordinate,w_m,(m1_m-mref_m),fm2 );


            call clustering_value1(&
                &fc,n_source,ujk,V,C,m1_g,m1_m);


            write(*,*)fd1,lu_g*fm1,lambda_g*fc;
            write(*,*)fd2,lu_m*fm2,lambda_m*fc;


            lu_g=lu_g*0.9;
            lu_m=lu_m*0.9;
            write(*,*)'lu_g=',lu_g;
            write(*,*)'lu_m=',lu_m;


            pl1=Fd1;
            write(*,*) 'gravity_data_value=',pl1
            write(11,*) kk,pl1

            pl2=Fd2;
            write(*,*) 'magnetic_data_value=',pl2;
            write(12,*) kk,pl2;
            write(*,*)


    enddo
    deallocate(ujk,V1,V2);
    call cpu_time(t20);
    write(*,*)'Inversion time(s)=',t20-t10,'s';


    return
    End subroutine fcrm_triple_2D_joint_inversion


    !------------------------------------------------------------------------
    !
    !  功能：计算隶属度函数
    !
    !  输入参数说明：
    !               P：迭代中产生的模型参数矩阵
    !               C：聚类类别数
    !               v：聚类中心
    !               q：聚类指数
    !        n_source：物性参数个数
    !
    !  输出参数说明：
    !          uk,ujk：隶属度函数
    !
    !------------------------------------------------------------------------
    Subroutine  com_u(&
		   &m1,m2,q,C,n_source,ujk,V )
    implicit none


    integer n_source,C,i,j,L,k
    double precision::m1(n_source),m2(n_source),ujk(n_source,C),V(C,2)
    double precision::b,q,aa
    double precision,allocatable::a(:)


    allocate( a(n_source) );
    a=0.0;
    ujk=0.0;
    do j=1,n_source,1
        do k=1,C,1
            a(j)=a(j)+( ( m2(j)- V(k,1)*m1(j)- V(k,2) )**2.0 )**(-1.0/(q-1.0));
        enddo
    enddo


    b=0.0;
    do j=1,n_source,1
        do k=1,C,1
            aa=m2(j)- V(k,1)*m1(j)- V(k,2);
            b=b+( aa**2.0 )**(-1.0/(q-1.0));
            ujk(j,k)=b/a(j);
            b=0.0;
            if(aa.eq.0.0)then
                ujk(j,k)=1.0;
            endif
        enddo
    enddo
    deallocate(a);


    return
    End  subroutine  com_u


    !------------------------------------------------------------------------
    !
    !  功能：计算聚类中心
    !
    !  输入参数说明：
    !              m1：迭代中产生的模型参数矩阵
    !               C：聚类类别数
    !               v：聚类中心
    !              tk：目标聚类中心
    !               q：聚类指数
    !             eta：聚类第二个加权参数
    !        n_source：物性参数个数
    !
    !  输出参数说明：
    !              vk：聚类中心矩阵
    !
    !------------------------------------------------------------------------
    Subroutine com_v( &
		   &m1,m2,q,C,eta1,eta2,tk,n_source,ujk,V )
    implicit none


    integer n_source,C,i,j,k
    double precision::m1(n_source),m2(n_source)
    double precision::V(C,2),ujk(n_source,C),tk(C,2),eta1,eta2,q
    double precision::a1,b1,a2,b2


    a1=0.0;
    b1=0.0;
    a2=0.0;
    b2=0.0;
    do i=1,C,1
        do j=1,n_source,1
            a1=a1 + m1(j)*( ujk(j,i)**q )*m1(j);
            b1=b1 + m1(j)*( ujk(j,i)**q )*( m2(j) - V(i,2) );
            a2=a2 + ( ujk(j,i)**q );
            b2=b2 + ( ujk(j,i)**q )*( m2(j) - V(i,1)*m1(j) );
        enddo

        !write(*,*)a1,b1,a2,b2
        a1=a1 + eta1;
        b1=b1 + eta1*tk(i,1);
        V(i,1)=b1/a1;

        a2=a2 + eta2;
        b2=b2 + eta2*tk(i,2);
        V(i,2)=b2/a2;
        a1=0.0;
        b1=0.0;
        a2=0.0;
        b2=0.0;
    enddo


    return
    End  subroutine com_v


    !------------------------------------------------------------------------
    !
    !  功能：计算每一步迭代的梯度值
    !  输入参数说明：
    !   n_source,n_coordinate：物性参数个数
    !   G,d_obs,mref,wd,wm,lu,lam
    !
    !  输出参数说明：
    !   f：目标函数梯度
    !   f = G'*Wd'*Wd*(G*m1 - d_obs) + β*Wm'*Wm*(m1 - mref)
    !       - λ*V1*[ujk**2]*[m2 - V1*m1 - V2]
    !
    !------------------------------------------------------------------------
    Subroutine update_gradient_g( &
		   &cengshu,poufen_parame,as,ax,az,ws,ww,&
		   &n_coordinate,n_source,x_source,z_source,&
		   &x_coordinate,z_coordinate,&
		   &m1,m2,mref,d_obs,wd,w,&
		   &lu,lambda,C,V,ujk,f )
    implicit none


    integer n_source,n_coordinate,C,cengshu
    integer poufen_parame(cengshu,2)
    double precision::ax,as,az,ww,ws
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::x_coordinate(n_coordinate),z_coordinate(n_coordinate)
    double precision::x,z
    double precision::d_obs(n_coordinate),w(n_source)
    double precision::wd(n_coordinate)
    double precision::lu,lambda
    double precision::m1(n_source),m2(n_source),mref(n_source)
    double precision::ujk(n_source,C),V(C,2)
    double precision::f(n_source)
    integer k,n,i,j,l
    double precision,allocatable::g11(:),u1(:)


    allocate( g11(n_source) )
    g11=0.0;
    call computation_gradient_g( &
        &g11,m1,mref,d_obs,wd,w,lu,&
        &cengshu,poufen_parame,as,ax,az,ws,ww,&
        &n_coordinate,n_source,x_source,z_source,&
        &x_coordinate,z_coordinate );

    allocate( u1(n_source) );
    u1=0.0;
    do j=1,C,1
      do i=1,n_source,1
         u1(i)=u1(i)+V(j,1)*( ujk(i,j)**2 )*( m2(i)-V(j,1)*m1(i)-V(j,2) );
      enddo
    enddo
    f=g11-lambda*u1;
    deallocate( g11,u1 );


    return
    End subroutine update_gradient_g


    !------------------------------------------------------------------------
    !
    !   输出参数说明：
    !   f：目标函数梯度
    !   f = G'*Wd'*Wd*(G*m2 - d_obs)+β*Wm'*Wm*(m2 - mref) +
    !       λ*(ujk**2)*(m2-V1*m1-V2)
    !
    !------------------------------------------------------------------------
    Subroutine update_gradient_m( &
		   &cengshu,poufen_parame,as,ax,az,ws,ww,&
		   &n_coordinate,n_source,x_source,z_source,&
		   &x_coordinate,z_coordinate,B0,tz,tx,az1,ax1,&
		   &m1,m2,mref,d_obs,wd,w,&
		   &lu,lambda,C,V,ujk,f)
    implicit none


    integer n_source,n_coordinate,C,cengshu
    integer poufen_parame(cengshu,2)
    double precision::ax,as,az,ww,ws
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::x_coordinate(n_coordinate),z_coordinate(n_coordinate)
    double precision::x,z
    double precision::B0,tz,tx,az1,ax1
    double precision::wd(n_coordinate)
    double precision::d_obs(n_coordinate),w(n_source)
    double precision::lu,lambda
    double precision::m1(n_source),m2(n_source),mref(n_source)
    double precision::ujk(n_source,C),V(C,2)
    double precision::f(n_source)
    integer k,n,i,j,l
    double precision,allocatable::g11(:),u1(:)


    allocate( g11(n_source) )
    g11=0.0;
    call computation_gradient_m( &
        &g11,m2,mref,d_obs,wd,w,lu,&
        &cengshu,poufen_parame,as,ax,az,ws,ww,&
        &n_coordinate,n_source,x_source,z_source,&
        &x_coordinate,z_coordinate,B0,tz,tx,az1,ax1 );


    allocate( u1(n_source) );
    u1=0.0;
    do j=1,C,1
      do i=1,n_source,1
         u1(i)=u1(i)+( ujk(i,j)**2 )*( m2(i)-V(j,1)*m1(i)-V(j,2) );
      enddo
    enddo
    f=g11+lambda*u1;
    deallocate( g11,u1 );


    return
    End subroutine update_gradient_m


    !------------------------------------------------------------------------
    !
    !  功能：基于共轭梯度法得步长选择
    !  输入参数说明：
    !              C_b,t_b：更新正则化参数值的相关系数值
    !              Fd1,Fd2：第n次迭代数据约束项数值
    !                   Lu：正则化参数
    !
    !  输出参数说明：
    !                   lu：更新后的正则化参数数值
    !   步长：α = - ( dk'*f )/( dk'*A*dk )
    !   dk'*A*dk= dk'*(G'*Wd'*Wd*G)*dk + β*dk'*(Wm'*Wm)*dk +
    !                       λ*dk'*(V1*ujk^2*V1)*dk
    !
    !------------------------------------------------------------------------
    Subroutine  update_del_m_CG_g( &
		   &cengshu,poufen_parame,as,ax,az,ws,ww,&
		   &n_coordinate,n_source,x_source,z_source,&
		   &x_coordinate,z_coordinate,&
		   &lu,lambda,wd,w,C,V,ujk,d,f,del_g )
    implicit none


    integer n_source,n_coordinate,C,cengshu
    integer poufen_parame(cengshu,2)
    double precision::ax,as,ay,az,ww,ws
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::x_coordinate(n_coordinate),z_coordinate(n_coordinate)
    double precision::x,z
    double precision::lu,lambda
    double precision::w(n_source),wd(n_coordinate)
    double precision::ujk(n_source,C),V(C,2),u1(n_source)
    double precision::f(n_source)           !梯度
    double precision::d(n_source)           !搜索方向
    double precision::del_g
    double precision::b,b1,duud
    integer i,j


    b=0.0;
    call computation_dAd_g( &
        &b,d,wd,w,lu,&
        &cengshu,poufen_parame,as,ax,az,ws,ww,&
        &n_coordinate,n_source,x_source,z_source,&
        &x_coordinate,z_coordinate );

    u1=0.0;
    do i=1,n_source,1
        do j=1,C,1
            u1(i) = u1(i) + (V(j,1)**2)*( ujk(i,j)**2 );
        enddo
    enddo


    duud=0.0;
    !$acc parallel
    !$acc loop reduction (+:duud)
    do i=1,n_source,1
        duud = duud + d(i)*u1(i)*d(i);
    enddo
    !$acc end loop
    !$acc end parallel
    b = b + lambda*duud;


    b1=0.0;
    !$acc parallel
    !$acc loop reduction (+:b1)
    do i=1,n_source,1
       b1 = b1 + ( - f(i) )*d(i);
    enddo
    !$acc end loop
    !$acc end parallel
    del_g = b1/b;


    return
    End subroutine update_del_m_CG_g


    !------------------------------------------------------------------------
    !
    !   功能：基于共轭梯度法得步长选择
    !   步长：α = - ( dk'*f )/( dk'*A*dk )
    !   dk'*A*dk = dk'*(G'*Wd'*Wd*G)*dk + dk'*(Wm'*Wm)*dk +
    !                       λ*dk'*(ujk^2*)*dk
    !
    !------------------------------------------------------------------------
    Subroutine  update_del_m_CG_m( &
		   &cengshu,poufen_parame,as,ax,az,ws,ww,&
		   &n_coordinate,n_source,x_source,z_source,&
		   &x_coordinate,z_coordinate,B0,tz,tx,az1,ax1,&
		   &lu,lambda,wd,w,C,V,ujk,d,f,del_m )
    implicit none


    integer n_source,n_coordinate,C,cengshu
    integer poufen_parame(cengshu,2)
    double precision::ax,as,az,ww,ws
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::x_coordinate(n_coordinate),z_coordinate(n_coordinate)
    double precision::x,z
    double precision::B0,tz,tx,az1,ax1
    double precision::lu,lambda
    double precision::w(n_source),wd(n_coordinate)
    double precision::ujk(n_source,C),V(C,2),u1(n_source)
    double precision::f(n_source)           !梯度
    double precision::d(n_source)           !搜索方向
    double precision::del_m
    double precision::b,b1,duud
    integer i,j


    b=0.0;
    call computation_dAd_m(&
        &b,d,wd,w,lu,&
        &cengshu,poufen_parame,as,ax,az,ws,ww,&
        &n_coordinate,n_source,x_source,z_source,&
        &x_coordinate,z_coordinate,B0,tz,tx,az1,ax1);


    u1=0.0;
    do j=1,C,1
      do i=1,n_source,1
         u1(i) = u1(i) + ( ujk(i,j)**2 );
      enddo
    enddo


    duud=0.0;
    !$acc parallel
    !$acc loop reduction (+:duud)
    do i=1,n_source,1
        duud =duud+d(i)*u1(i)*d(i);
    enddo
    !$acc end loop
    !$acc end parallel
    b = b+lambda*duud;


    b1=0.0;
    !$acc parallel
    !$acc loop reduction (+:b1)
    do i=1,n_source,1
       b1 = b1+(-f(i))*d(i);
    enddo
    !$acc end loop
    !$acc end parallel
    del_m = b1/b;


    return
    End subroutine update_del_m_CG_m


    !------------------------------------------------------------------------
    !
    !  功能：根据反演结果动态改变引导约束项的参数值 (如果聚类中心改变值小于一定的限度，
    !        并且与目标聚类中心有较大的差距)
    !  输入参数说明：
    !                 V1：前一次聚类中心值
    !                 V2：当前聚类中心值
    !                eta：引导约束项加权参数值
    !                 tk：目标聚类中心值
    !                  C：聚类类别数
    !
    !  输出参数说明：
    !                eta：更新后的加权参数值
    !
    !------------------------------------------------------------------------
    Subroutine  update_guide_weighting_parameter( &
			&V1,V2,C,tk,eta_g,eta_m )
    implicit none


    integer C,i
    double precision::V0(C,2),V1(C,2),V2(C,2),tk(C,2)
    double precision::lu_g,lambda_g,eta_g
    double precision::lu_m,lambda_m,eta_m
    double precision::a,b,D


    V0=V2-V1;
    a=maxval(V0);
    b=MAXVAL(tk);
    D=maxval(V2);


    !如果聚类中心改变值小于一定的限度，并且与目标聚类中心有较大的差距
    if( a.lt.0.002 )then
        eta_g=eta_g*1.1;
        eta_m=eta_m*1.1;
    else
        eta_g=eta_g;
        eta_m=eta_m;
    endif


    return
    End subroutine update_guide_weighting_parameter


    !------------------------------------------------------------------------
    !
    !  功能：求模糊聚类约束项的值
    !
    !  输入参数说明：
    !                 V1：前一次聚类中心值
    !                 V2：当前聚类中心值
    !                eta：引导约束项加权参数值
    !                 tk：目标聚类中心值
    !                  C：聚类类别数
    !
    !  输出参数说明：
    !                eta：更新后的加权参数值
    !
    !------------------------------------------------------------------------
    Subroutine clustering_value1(&
		   &fc,n_source,ujk,V,C,m1,m2 )
    implicit none


    integer n_source
    integer C,k,i,j
    double precision::m1(n_source),m2(n_source)
    double precision::ujk(n_source,C),V(C,2)
    double precision::fc


    fc=0.0;
    do k=1,C,1
        do j=1,n_source,1
            fc=fc + ( ujk(j,k)**2 )*( (m2(j)-V(k,1)*m1(j)-V(k,2))**2 );
        enddo
    enddo


    return
    End subroutine clustering_value1


    !----------------------------------------------------------------------
    !
    !  功能：计算数据目标函数的梯度
    !   f=G'*Wd'*Wd*(G*m1-d_obs)+β*Wm'*Wm*(m1-mref)
    !
    !------------------------------------------------------------------------
    Subroutine computation_gradient_g(&
           &f,m1,mref,d_obs,wd,w,lu,&
           &cengshu,poufen_parame,as,ax,az,ws,ww,&
           &n_coordinate,n_source,x_source,z_source,&
           &x_coordinate,z_coordinate)
    implicit none


    integer k,n,i,j,l
    integer n_source,n_coordinate,cengshu
    integer poufen_parame(cengshu)
    double precision::ax,as,az,ww,ws
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::x_coordinate(n_coordinate),z_coordinate(n_coordinate)
    double precision::x,y,z,lu
    double precision::wd(n_coordinate),w(n_source)
    double precision::m1(n_source),mref(n_source),d_obs(n_coordinate)
    double precision::f(n_source)
    double precision,allocatable::g2(:),g11(:),g12(:),d_pre(:),d_delt(:),wwd(:)


    allocate(d_pre(n_coordinate))
    d_pre=0.0;
    call computation_d_pre_g(&
		&d_pre,m1,&
		&n_coordinate,n_source,x_source,z_source,&
		&x_coordinate,z_coordinate);


	allocate(d_delt(n_coordinate));
	d_delt=0.0;
    d_delt=d_pre-d_obs;
    deallocate(d_pre);


    allocate(wwd(n_coordinate));
    wwd=0.0;
    !$acc kernels
    do i=1,n_coordinate,1
        wwd(i)=wd(i)*wd(i)*d_delt(i);
    enddo
    !$acc end kernels
    deallocate(d_delt);


    allocate(g2(n_coordinate),g11(n_source));
    g11=0.0;
    do j=1,n_source,1
        g2=0.0;
        call computation_G_g_Column(&
            &g2,n_coordinate,n_source,j,x_source,z_source,&
            &x_coordinate,z_coordinate);

        do i=1,n_coordinate,1
            g11(j)=g11(j)+g2(i)*wwd(i);
        enddo
    enddo
    deallocate(wwd,g2);


    allocate(g12(n_source));
    g12=0.0;
    call computation_WWm(&
        &x_source,z_source,n_source,cengshu,&
        &poufen_parame,as,ax,az,ws,ww,&
        &n_coordinate,w,(m1-mref),g12);

    f=0.0;
    f=g11+lu*g12;
    deallocate(g11,g12);


    return
    End subroutine computation_gradient_g


    !----------------------------------------------------------------------
    !
    !   功能：计算步长：α=-(dk'*f)/(dk'*A*dk)
    !
    !------------------------------------------------------------------------
    Subroutine computation_del_g(&
           &del_g,f,d,wd,w,lu,&
           &cengshu,poufen_parame,as,ax,az,ws,ww,&
           &n_coordinate,n_source,x_source,z_source,&
           &x_coordinate,z_coordinate)
    implicit none


    integer k,n,i,j,l
    integer n_source,n_coordinate,cengshu
    integer poufen_parame(cengshu)
    double precision::ax,as,az,ww,ws
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::x_coordinate(n_coordinate),z_coordinate(n_coordinate)
    double precision::x,z,lu
    double precision::wd(n_coordinate),w(n_source)
    double precision::d(n_source),f(n_source)
    double precision::b,b1,del_g


    b=0.0;
    call computation_dAd_g(&
        &b,d,wd,w,lu,&
        &cengshu,poufen_parame,as,ax,az,ws,ww,&
        &n_coordinate,n_source,x_source,z_source,&
        &x_coordinate,z_coordinate);


    b1=0.0;
    !$acc parallel
    !$acc loop reduction (+:b1)
    do i=1,n_source,1
       b1=b1+(-f(i))*d(i);
    enddo
    !$acc end loop
    !$acc end parallel
    del_g=b1/b;


    return
    End subroutine computation_del_g


    !----------------------------------------------------------------------
    !
    !  功能：计算步长计算中间量：分母dk'*A*dk
    !   dk'*A*dk = dk'*(G'*Wd'*Wd*G)*dk + β*dk'*(Wm'*Wm)*dk
    !
    !------------------------------------------------------------------------
    Subroutine computation_dAd_g(&
           &b,d,wd,w,lu,&
           &cengshu,poufen_parame,as,ax,az,ws,ww,&
           &n_coordinate,n_source,x_source,z_source,&
           &x_coordinate,z_coordinate)
    implicit none


    integer k,n,i,j,l
    integer n_source,n_coordinate,cengshu
    integer poufen_parame(cengshu)
    double precision::ax,as,az,ww,ws
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::x_coordinate(n_coordinate),z_coordinate(n_coordinate)
    double precision::x,z,lu
    double precision::wd(n_coordinate),w(n_source)
    double precision::d(n_source),dggd,dwwd,b
    double precision,allocatable::gd(:),g1(:),wgd(:)


    allocate(gd(n_coordinate),g1(n_source))
    gd=0.0;
    do i=1,n_coordinate,1
        x=x_coordinate(i);
        z=z_coordinate(i);
        g1=0.0;
        call computation_G_g_Row(&
            &g1,n_source,x_source,z_source,x,z);

        do j=1,n_source,1
            gd(i)=gd(i)+g1(j)*d(j);
        enddo
    enddo
    deallocate(g1);


    allocate(wgd(n_coordinate));
    wgd=0.0;
    !$acc kernels
    do i=1,n_coordinate,1
        wgd(i)=wd(i)*gd(i);
    enddo
    !$acc end kernels
    deallocate(gd);


    dggd=0.0;
    !$acc parallel
    !$acc loop reduction (+:dggd)
    do i=1,n_coordinate,1
        dggd=dggd+wgd(i)**2;
    enddo
    !$acc end loop
    !$acc end parallel
    deallocate(wgd);


    dwwd=0.0;
    call computation_module_valaue(&
        &x_source,z_source,n_source,cengshu,&
        &poufen_parame,as,ax,az,ws,ww,&
        &n_coordinate,w,d,dwwd);

    b=dggd+lu*dwwd;


    return
    End subroutine computation_dAd_g


    !------------------------------------------------------------------------
    !
    !   功能：计算梯度
    !   f = G'*Wd'*Wd*(G*m2 - d_obs) + β*Wm'*Wm*(m2 - mref)
    !
    !------------------------------------------------------------------------
    Subroutine computation_gradient_m(&
           &f,m1,mref,d_obs,wd,w,lu,&
           &cengshu,poufen_parame,as,ax,az,ws,ww,&
           &n_coordinate,n_source,x_source,z_source,&
           &x_coordinate,z_coordinate,B0,tz,tx,az1,ax1)
    implicit none


    integer k,n,i,j,l
    integer n_source,n_coordinate,cengshu
    integer poufen_parame(cengshu)
    double precision::ax,as,az,ww,ws
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::x_coordinate(n_coordinate),z_coordinate(n_coordinate)
    double precision::x,z,lu
    double precision::tx,tz,ax1,az1,B0
    double precision::m1(n_source),mref(n_source)
    double precision::wd(n_coordinate),w(n_source),d_obs(n_coordinate)
    double precision::f(n_source)
    double precision,allocatable::g2(:),g11(:),g12(:),d_pre(:),d_delt(:),wwd(:)



    allocate(d_pre(n_coordinate))
    d_pre=0.0;
    call computation_d_pre_m(&
		&d_pre,m1,&
		&n_coordinate,n_source,x_source,z_source,&
		&x_coordinate,z_coordinate,B0,tz,tx,az1,ax1);


    allocate(d_delt(n_coordinate));
    d_delt=0.0;
    d_delt=d_pre-d_obs;
    deallocate(d_pre);


    allocate(wwd(n_coordinate));
    wwd=0.0;
    !$acc kernels
    do i=1,n_coordinate,1
        wwd(i)=wd(i)*wd(i)*d_delt(i);
    enddo
    !$acc end kernels
    deallocate(d_delt);


    allocate(g2(n_coordinate),g11(n_source))
    g11=0.0;
    do j=1,n_source,1
        g2=0.0;
        call computation_G_mag_Column(&
            &g2,n_coordinate,n_source,j,x_source,z_source,&
            &x_coordinate,z_coordinate,B0,tz,tx,az1,ax1);

        do i=1,n_coordinate,1
            g11(j)=g11(j)+g2(i)*wwd(i);
        enddo
    enddo
    deallocate(wwd,g2);


    allocate(g12(n_source));
    g12=0.0;
    call computation_WWm(&
        &x_source,z_source,n_source,cengshu,&
        &poufen_parame,as,ax,az,ws,ww,&
        &n_coordinate,w,(m1-mref),g12);

    f=g11+lu*g12;
    deallocate(g11,g12);


    return
    End subroutine computation_gradient_m


    !----------------------------------------------------------------------
    !
    !   计算步长：α=-(dk'*f)/(dk'*A*dk)
    !
    !------------------------------------------------------------------------
    Subroutine computation_del_m( &
           &del_m,f,d,wd,w,lu,&
           &cengshu,poufen_parame,as,ax,az,ws,ww,&
           &n_coordinate,n_source,x_source,z_source,&
           &x_coordinate,z_coordinate,B0,tz,tx,az1,ax1 )
    implicit none


    integer k,n,i,j,l
    integer n_source,n_coordinate,cengshu
    integer poufen_parame(cengshu)
    double precision::ax,as,az,ww,ws
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::x_coordinate(n_coordinate),z_coordinate(n_coordinate)
    double precision::x,z,lu
    double precision::B0,tz,tx,az1,ax1
    double precision::wd(n_coordinate),w(n_source)
    double precision::d(n_source),f(n_source)
    double precision::b,b1,del_m


    b=0.0;
    call computation_dAd_m(&
        &b,d,wd,w,lu,&
        &cengshu,poufen_parame,as,ax,az,ws,ww,&
        &n_coordinate,n_source,x_source,z_source,&
        &x_coordinate,z_coordinate,B0,tz,tx,az1,ax1);

    b1=0.0;
    !$acc parallel
    !$acc loop reduction (+:b1)
    do i=1,n_source,1
       b1=b1+(-f(i))*d(i);
    enddo
    !$acc end loop
    !$acc end parallel
    del_m=b1/b;


    return
    End subroutine computation_del_m


    !----------------------------------------------------------------------
    !
    !  功能：计算步长计算中间量：分母dk*A*dk
    !   dk'*A*dk = dk'*(G'*Wd'*Wd*G)*dk+β*dk'*(Wm'*Wm)*dk
    !
    !------------------------------------------------------------------------
    Subroutine computation_dAd_m(&
           &b,d,wd,w,lu,&
           &cengshu,poufen_parame,as,ax,az,ws,ww,&
           &n_coordinate,n_source,x_source,z_source,&
           &x_coordinate,z_coordinate,B0,tz,tx,az1,ax1)
    implicit none


    integer k,n,i,j,l
    integer n_source,n_coordinate,cengshu
    integer poufen_parame(cengshu)
    double precision::ax,as,az,ww,ws
    double precision::x_source(n_source,2),z_source(n_source,2)
    double precision::x_coordinate(n_coordinate),z_coordinate(n_coordinate)
    double precision::x,z,lu
    double precision::B0,tz,tx,az1,ax1
    double precision::wd(n_coordinate),w(n_source)
    double precision::d(n_source),dggd,dwwd,b
    double precision,allocatable::gd(:),g1(:),wgd(:)


    allocate(gd(n_coordinate),g1(n_source));
    gd=0.0;
    do i=1,n_coordinate,1
        x=x_coordinate(i);
        z=z_coordinate(i);
        g1=0.0;
        call computation_G_mag_Row(&
            &g1,n_source,x_source,z_source,&
            &x,z,B0,tz,tx,az1,ax1);

        do j=1,n_source,1
            gd(i)=gd(i)+g1(j)*d(j);
        enddo
    enddo
    deallocate(g1);


    allocate(wgd(n_coordinate));
    wgd=0.0;
    !$acc kernels
    do i=1,n_coordinate,1
        wgd(i)=wd(i)*gd(i);
    enddo
    !$acc end kernels
    deallocate(gd);


    dggd=0.0;
    !$acc parallel
    !$acc loop reduction (+:dggd)
    do i=1,n_coordinate,1
        dggd=dggd+wgd(i)**2;
    enddo
    !$acc end loop
    !$acc end parallel
    deallocate(wgd);


    dwwd=0.0;
    call computation_module_valaue(&
        &x_source,z_source,n_source,cengshu,&
        &poufen_parame,as,ax,az,ws,ww,&
        &n_coordinate,w,d,dwwd);

    b=dggd+lu*dwwd;


    return
    End subroutine computation_dAd_m



	end module fcrm_2d_gminv






